import { encodeFunctionData, parseAbi, type Hex } from "viem"
import type { SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { CreateSessionDataParams, SmartSessionMode, type Module } from "../utils/Types.js"
import { encodeSmartSessionSignature } from "../utils/SmartSessionHelpers.js"
import { type Session } from "../utils/Types.js"
import { TEST_CONTRACTS } from "../../../tests/src/callDatas.js"

const DUMMY_ECDSA_SIG = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";

const UNIVERSAL_POLICY_ADDRESS = TEST_CONTRACTS.UniversalPolicy.address
const SMART_SESSION_ADDRESS = TEST_CONTRACTS.SmartSession.address

// Note: flows: use mode and enable mode both should be supported.
export class SmartSessionModule extends BaseValidationModule {
  // Notice: For smart sessions signer could be anything. Which is an implementation of ISessionValidator interface
  // SmartAccountSigner works if session validator is K1 like single signer.
  private constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }
  
  public static async create(
    signer: SmartAccountSigner,
    smartSessionAddress = SMART_SESSION_ADDRESS,
  ): Promise<SmartSessionModule> {
    const module: Module = {
      moduleAddress: smartSessionAddress,
      type: "validator",
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    const instance = new SmartSessionModule(module, signer)
    return instance
  }

  // Note: this second argument is like ModuleInfo object which is needed for certain modules like SKM for v2 account sdk
  override async signUserOpHash(userOpHash: string, permissionId?: Hex): Promise<Hex>{
    const signature = await this.signer.signMessage({ raw: userOpHash as Hex })
    
    // Not this function is only implemented for USE mode.
    return encodeSmartSessionSignature({
      mode: SmartSessionMode.USE,
      permissionId: permissionId ? permissionId : '0x',
      signature,
    }) as Hex
  }

  override getDummySignature(permissionId?: Hex): Hex {
    return encodeSmartSessionSignature({
      mode: SmartSessionMode.USE,
      permissionId: permissionId ? permissionId : '0x',
      signature: DUMMY_ECDSA_SIG,
    }) as Hex 
  }

  // To remind again how a session looks like..

  /*
   [
      {
        sessionValidator: OWNABLE_VALIDATOR_ADDRESS as Address,
        sessionValidatorInitData: encodeValidationData({
          threshold: 1,
          owners: [privateKeyToAccount(process.env.PRIVATE_KEY as Hex).address],
        }),
        salt: toHex(toBytes('1', { size: 32 })),
        userOpPolicies: [],
        actions: [
          {
            actionTarget: account.address,
            actionTargetSelector: '0x9cfd7cff' as Hex,
            actionPolicies: [
              {
                policy: getSudoPolicy().address,
                initData: getSudoPolicy().initData,
              },
            ],
          },
        ],
        erc7739Policies: {
          allowedERC7739Content: [],
          erc1271Policies: [],
        },
      },
    ]
  */
  
  // Notice: 
  // This is a USE mode so we need calldata to post on smart session module to make sessions enabled first.
  // For enable mode we will just need to preapre digest to sign and then make a userOperation that has actual session tx.

  // Note: can later create methods like 

  createSessionData = async (
    sessionRequestedInfo: CreateSessionDataParams[]
  ): Promise<void> => {

    // 1. iteraste over sessionRequestedInfo and make ActionConfig using the passed rules and value limit (calculate rules length and fit in object)

    // 2. call getUniversalActionPolicy that will give you policy object

    // 3. Build actionData from this policy object and contractAddress and func selector
    // type is
    /*export type ActionData = {
      actionTargetSelector: Hex
      actionTarget: Address
      actionPolicies: PolicyData[]
    }*/

    // Build the session objects then apply below.  

    // Review
    const smartSessionBI = parseAbi([
      "function enableSessions((address,bytes,bytes32,(address,bytes)[],(string[],(address,bytes)[]),(bytes4,address,(address,bytes)[])[])[])"
    ])

    const sessions: Session[] = [];

    // const enableSessionsData = encodeFunctionData({
    //   abi: smartSessionBI,
    //   functionName: "enableSessions",
    //   args: [sessions]
    // })
  }



  // Note:
  // Needs more helpers to create a session struct. given constant validator, policies need to be built.
  // Could be in helpers
  // Todo:L
  // Temp comment below

  /*Session memory session = Session({
            sessionValidator: ISessionValidator(address(yesSigner)),
            salt: salt,
            sessionValidatorInitData: "mockInitData",
            userOpPolicies: _getEmptyPolicyDatas(address(yesPolicy)),
            erc7739Policies: _getEmptyERC7739Data("mockContent", _getEmptyPolicyDatas(address(yesPolicy))), // optional and default empty
            actions: _getEmptyActionDatas(_target, MockTarget.setValue.selector, address(yesPolicy)) // mocks. but usually one universal policy is enough
   });*/
}
