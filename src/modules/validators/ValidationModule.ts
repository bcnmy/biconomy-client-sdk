import type { Address, Hex } from "viem"
import { ModuleType, type SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { V3ModuleInfo } from "../utils/Types.js"

export class ValidationModule extends BaseValidationModule {
  private constructor(moduleConfig: V3ModuleInfo, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner,
    moduleAddress: Address,
    data: Hex
  ): Promise<ValidationModule> {
    const moduleInfo: V3ModuleInfo = {
      module: moduleAddress,
      type: ModuleType.Validation,
      data,
      additionalContext: "0x"
    }
    const instance = new ValidationModule(moduleInfo, signer)
    return instance
  }
}
