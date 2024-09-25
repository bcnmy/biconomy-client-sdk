import {
    type Address,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    pad,
    toBytes,
    toHex
} from "viem"
import type { AbiFunction, Hex, PublicClient } from "viem"
import { type NexusAccount, type Signer, toSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { type Module } from "../../clients/index.js"
import addresses from "../../__contracts/addresses.js"
import { type ActionData, encodeSmartSessionSignature, type PolicyData, type Session, SmartSessionMode } from "@rhinestone/module-sdk"
import { type ActionConfig, type CreateSessionDataParams, type CreateSessionDataResponse, type ModuleInfo, type ParamRule } from "../utils/Types.js"
import { smartSessionAbi, universalActionPolicyAbi } from "../utils/abi.js"
import { getPermissionId, toActionConfig } from "../index.js"

const DUMMY_ECDSA_SIG = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";
const UNIVERSAL_POLICY_ADDRESS = addresses.UniActionPolicy
const TIMEFRAME_POLICY_ADDRESS = addresses.TimeframePolicy
const SIMPLE_SESSION_VALIDATOR_ADDRESS = addresses.SimpleSessionValidator

export class SmartSessionValidator extends BaseValidationModule {
    public client: PublicClient

    private constructor(
        moduleConfig: Module,
        signer: Signer,
        smartAccount: NexusAccount
    ) {
        // if (!moduleConfig.data) {
        //     throw new Error("Module data is required")
        // }
        super(moduleConfig, signer)
        const client = smartAccount.client as PublicClient;
        this.client = client
        this.signer = signer
        // Review: could be optional override. otherwise use SMART_SESSION_ADDRESS from addresses 
        this.address = moduleConfig.address
    }

    /// @notice: smart session validator does not need to be initialized
    public static async create({
        smartAccount,
        address,
        hook
    }: {
        smartAccount: NexusAccount,
        address: Address,
        hook?: Address
    }): Promise<SmartSessionValidator> {
        let moduleInfo: Module
        // let installData: Hex
        // const client = smartAccount.client as PublicClient;
        moduleInfo = {
            address, // @todo: change to real module address
            type: "validator",
            data: '0x', // installData
            additionalContext: "0x",
            hook
        }
        const account = smartAccount.client.account
        // Note: here the signer provided is existing smart account's signer.
        // Review: this would be session key signer. Only applies in the case where SessionValidator supplied in SimpleValidator (ECDSA)
        const instance = new SmartSessionValidator(moduleInfo, await toSigner({ signer: account! }), smartAccount)
        return instance
    }

    public override getDummySignature(moduleInfo?: ModuleInfo): Hex {
        const signature = encodeSmartSessionSignature({
            mode: moduleInfo?.mode ? moduleInfo.mode : SmartSessionMode.USE,
            permissionId: moduleInfo?.permissionId ? moduleInfo.permissionId : '0x',
            signature: DUMMY_ECDSA_SIG,
        }) as Hex
        return signature
    }

    override async signUserOpHash(userOpHash: string, moduleInfo?: ModuleInfo): Promise<Hex>{
        const signature = await this.signer.signMessage({ message: { raw: userOpHash as Hex } }) as Hex
        return encodeSmartSessionSignature({
          mode: moduleInfo?.mode ? moduleInfo.mode : SmartSessionMode.USE,
          permissionId: moduleInfo?.permissionId ? moduleInfo.permissionId : '0x',
          signature,
        }) as Hex
    }

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
        const createActionConfig = (rules: ParamRule[], valueLimit: bigint): ActionConfig => {
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

        // Start populating the session for each param provided
        for (const sessionInfo of sessionRequestedInfo) {
            const actionPolicies: ActionData[] = [];
            for (const actionPolicyInfo of sessionInfo.actionPoliciesInfo) {
                const actionConfig = createActionConfig(actionPolicyInfo.rules, actionPolicyInfo.valueLimit);

                // Build PolicyData
                const uniActionPolicyData: PolicyData = {
                policy: UNIVERSAL_POLICY_ADDRESS,
                // Build initData for UniversalActionPolicy
                initData: encodeAbiParameters(
                    universalActionPolicyAbi,
                    [toActionConfig(actionConfig)]
                    )
                };
                // create time range policy here..

                const validUntil = BigInt(actionPolicyInfo.validUntil); // uint128 in Solidity is represented as BigInt in TypeScript
                const validAfter = BigInt(actionPolicyInfo.validAfter);

                // Convert to bytes16 using 128-bit representation (uint128) and pad them correctly
                const validUntilBytes = pad(toBytes(validUntil, { size: 16 }), { dir: 'right', size: 16 });
                const validAfterBytes = pad(toBytes(validAfter, { size: 16 }), { dir: 'right', size: 16 });

                // Pack them using encodePacked to replicate Solidity abi.encodePacked
                const packedData = encodePacked(['bytes16', 'bytes16'], [toHex(validUntilBytes), toHex(validAfterBytes)]);
                // console.log("packedData", packedData);

                const timeFramePolicyData: PolicyData = {
                policy: TIMEFRAME_POLICY_ADDRESS,
                // Build initData for TimeframePolicy
                initData: packedData
                };

                // Create ActionData
                const actionPolicy = createActionData(
                    actionPolicyInfo.contractAddress,
                    actionPolicyInfo.functionSelector,
                    [uniActionPolicyData, timeFramePolicyData]
                );

                actionPolicies.push(actionPolicy);
            }

            const validUntil = BigInt(sessionInfo.sessionValidUntil ?? 0); // uint128 in Solidity is represented as BigInt in TypeScript
            const validAfter = BigInt(sessionInfo.sessionValidAfter ?? 0);

            // Convert to bytes16 using 128-bit representation (uint128) and pad them correctly
            const validUntilBytes = pad(toBytes(validUntil, { size: 16 }), { dir: 'right', size: 16 });
            const validAfterBytes = pad(toBytes(validAfter, { size: 16 }), { dir: 'right', size: 16 });

            // Pack them using encodePacked to replicate Solidity abi.encodePacked
            const packedData = encodePacked(['bytes16', 'bytes16'], [toHex(validUntilBytes), toHex(validAfterBytes)]);

            const userOpTimeFramePolicyData: PolicyData = {
                policy: TIMEFRAME_POLICY_ADDRESS,
                // Build initData for TimeframePolicy
                initData: packedData
            };

            const session: Session = {
                sessionValidator: sessionInfo.sessionValidatorAddress ?? SIMPLE_SESSION_VALIDATOR_ADDRESS,
                sessionValidatorInitData: sessionInfo.sessionKeyData, // sessionValidatorInitData: abi.encodePacked(sessionSigner1.addr),
                salt: generateSalt(),
                userOpPolicies: [userOpTimeFramePolicyData], //note: timeframe policy can also be applied to userOp, so it will have to be provided separately
                actions: actionPolicies,
                erc7739Policies: {
                  allowedERC7739Content: [],
                  erc1271Policies: []
                }
              };
        
              // todo: review should allow override of constant like SMART_SESSIONS_ADDRESS
              const permissionId = await getPermissionId({ client: this.client, session: session }) as Hex;
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