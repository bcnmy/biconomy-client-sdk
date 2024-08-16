import type { Address } from "viem"
import type { SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { V3ModuleInfo } from "../utils/Types.js"

export class K1ValidatorModule extends BaseValidationModule {
  private constructor(moduleConfig: V3ModuleInfo, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner,
    k1ValidatorAddress: Address
  ): Promise<K1ValidatorModule> {
    const moduleInfo: V3ModuleInfo = {
      module: k1ValidatorAddress,
      type: "validator",
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    const instance = new K1ValidatorModule(moduleInfo, signer)
    return instance
  }
}
