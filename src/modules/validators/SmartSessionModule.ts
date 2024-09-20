import { AbiFunction, Address, encodeAbiParameters, encodeFunctionData, encodePacked, pad, PublicClient, toBytes, toHex, type Hex } from "viem"
import addresses from "../../__contracts/addresses.js"
import type { SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { ActionData, CreateSessionDataParams, CreateSessionDataResponse, ModuleInfo, PolicyData, SmartSessionMode, type Module } from "../utils/Types.js"
import { ActionConfig, encodeSmartSessionSignature, getPermissionId, Rule, toActionConfig } from "../utils/SmartSessionHelpers.js"
import { type Session } from "../utils/Types.js"
import { smartSessionAbi, universalActionPolicyAbi } from "../utils/abi.js"

const DUMMY_ECDSA_SIG = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";

// Todo: review and discuss importing and naming between addresses and TEST_CONTRACTS
const UNIVERSAL_POLICY_ADDRESS = addresses.UniActionPolicy
const TIMEFRAME_POLICY_ADDRESS = addresses.TimeframePolicy
const SMART_SESSION_ADDRESS = addresses.SmartSession
const SIMPLE_SESSION_VALIDATOR_ADDRESS = addresses.SimpleSigner

// Note: flows: use mode and enable mode both should be supported.
export class SmartSessionModule extends BaseValidationModule {
  private client: PublicClient
  // Notice: For smart sessions signer could be anything. Which is an implementation of ISessionValidator interface
  // SmartAccountSigner works if session validator is K1 like single signer.
  // Todo: Review instead of a client smart account instance can be passed to the module.
  private constructor(moduleConfig: Module, signer: SmartAccountSigner, client: PublicClient) {
    super(moduleConfig, signer)
    this.client = client
  }
  
  // review: if it should get a signer object or just session key EOA address to be used with SimpleSessionValidator contract
  public static async create(
    client: PublicClient,
    signer: SmartAccountSigner,
    smartSessionAddress = SMART_SESSION_ADDRESS,
  ): Promise<SmartSessionModule> {
    const module: Module = {
      moduleAddress: smartSessionAddress,
      type: "validator",
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    return new SmartSessionModule(module, signer, client)
  }

  // Note: this second argument is like ModuleInfo object which is needed for certain modules like SKM for v2 account sdk
  override async signUserOpHash(userOpHash: string, moduleInfo?: ModuleInfo): Promise<Hex>{
    const signature = await this.signer.signMessage({ raw: userOpHash as Hex })    
    // Note this function is only implemented for USE mode.
    return encodeSmartSessionSignature({
      mode: SmartSessionMode.USE,
      permissionId: moduleInfo?.permissionId ? moduleInfo.permissionId : '0x',
      signature,
    }) as Hex
  }

  // Note: depends on the mode. based on the mode additional infromation is required and will need to use other read methods.
  override getDummySignature(params?: ModuleInfo): Hex {
    return encodeSmartSessionSignature({
      mode: SmartSessionMode.USE,
      permissionId: params?.permissionId ? params.permissionId : '0x',
      signature: DUMMY_ECDSA_SIG,
    }) as Hex 
  }
  
  // Notice: 
  // This is a USE mode so we need calldata to post on smart session module to make sessions enabled first.
  // For enable mode we will just need to preapre digest to sign and then make a userOperation that has actual session tx.
  // Note: can later create methods like directly enabling sessions by sending userop if we have SA instance
  // Todo: more methods to be created for enable mode.
  // Todo: more methods to be created for read methods.
  // Todo: more types can be added to incoporate time limit and userop policy.

  createSessionData = async (
    sessionRequestedInfo: CreateSessionDataParams[]
  ): Promise<CreateSessionDataResponse> => {

    const sessions: Session[] = [];
    const permissionIds: Hex[] = [];

    // Function to generate a random salt
    const generateSalt = (): Hex => {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
    return `0x${Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')}` as Hex;
    };
    
    // Helper function to create ActionConfig
    const createActionConfig = (rules: Rule[], valueLimit: bigint): ActionConfig => {
      return {
        paramRules: {
          length: rules.length,
          rules: rules
        },
        valueLimitPerUse: valueLimit
      };
    };

    // Helper function to create ActionData
    const createActionData = (contractAddress: Address, functionSelector: string | AbiFunction, policies: PolicyData[]): ActionData => {
      return {
        actionTarget: contractAddress,
        actionTargetSelector: (typeof functionSelector === 'string' ? functionSelector : functionSelector.name) as Hex,
        actionPolicies: policies
      };
    };

    for (const sessionInfo of sessionRequestedInfo) {
      // Create ActionConfig from already prepared rules
      const actionConfig = createActionConfig(sessionInfo.rules, sessionInfo.valueLimit);

      // Build PolicyData
      const uniActionPolicyData: PolicyData = {
        policy: UNIVERSAL_POLICY_ADDRESS,
        // Build initData for UniversalActionPolicy
        initData: encodeAbiParameters(universalActionPolicyAbi, [
          toActionConfig(actionConfig)
        ])
        
      };

      // note: optimise

      const validUntilBytes = pad(toBytes(sessionInfo.validUntil, { size: 6 }), { dir: 'right', size: 16 }); // Convert to bytes16
      const validAfterBytes = pad(toBytes(sessionInfo.validAfter, { size: 6 }), { dir: 'right', size: 16 }); // Convert to bytes16

      // Pack them using encodePacked to replicate Solidity abi.encodePacked
      const packedData = encodePacked(['bytes16', 'bytes16'], [toHex(validUntilBytes), toHex(validAfterBytes)]);
      console.log("packedData", packedData)

      const timeFramePolicyData: PolicyData = {
        policy: TIMEFRAME_POLICY_ADDRESS,
        // Build initData for TimeframePolicy
        initData: packedData
      };

      // Create policyDataArray with single element
      // here and above policies can be stacked.
      const policyDataArray: PolicyData[] = [uniActionPolicyData, timeFramePolicyData];


      // one action data per combination of contract address and function selector
      // which can have many action polciies (abi savm = uni action can be one of them)
      // and they all apply to combo of contract address and function selector aka actionId

      // Build ActionData
      const actionData = createActionData(
        sessionInfo.contractAddress,
        sessionInfo.functionSelector,
        policyDataArray
      );

      // Build Session object
      const session: Session = {
        sessionValidator: sessionInfo.sessionValidatorAddress ?? SIMPLE_SESSION_VALIDATOR_ADDRESS,
        sessionValidatorInitData: sessionInfo.sessionKeyData, // sessionValidatorInitData: abi.encodePacked(sessionSigner1.addr),
        salt: generateSalt(),
        userOpPolicies: [], //note: timeframe policy can also be applied to userOp, so it will have to be provided separately
        actions: [actionData],
        erc7739Policies: {
          allowedERC7739Content: [],
          erc1271Policies: []
        }
      };

      const permissionId = await getPermissionId({ client: this.client, session: session });
      // push permissionId to the array
      permissionIds.push(permissionId);

      // Push to sessions array
      sessions.push(session);
    }

    // Prepare enableSessions data
    const enableSessionsData = encodeFunctionData({
      abi: smartSessionAbi,
      functionName: "enableSessions",
      args: [sessions]
    });

    return { permissionIds: permissionIds, sessionsEnableData: enableSessionsData };
  }
}
