import { type Hex } from "viem"
import addresses from "../../__contracts/addresses.js"
import type { SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { SmartSessionMode, type Module } from "../utils/Types.js"
import { encodeSmartSessionSignature } from "../utils/SmartSessionHelpers.js"

const DUMMY_ECDSA_SIG = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";

export class SmartSessionModule extends BaseValidationModule {
  // Notice: For smart sessions signer could be anything. Which is an implementation of ISessionValidator interface
  // SmartAccountSigner works if session validator is K1 like single signer.
  private constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }
  
  public static async create(
    signer: SmartAccountSigner,
    smartSessionAddress = addresses.SmartSession,
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


}
