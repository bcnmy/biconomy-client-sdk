import {
  K1_VALIDATOR,
  ModuleType,
  type SmartAccountSigner
} from "../../account/index.js"
import type { V3ModuleInfo } from "../utils/Types.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"

export class K1ValidatorModule extends BaseValidationModule {
  private constructor(moduleConfig: V3ModuleInfo, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner
  ): Promise<K1ValidatorModule> {
    const moduleInfo: V3ModuleInfo = {
      module: K1_VALIDATOR,
      type: ModuleType.Validation,
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    const instance = new K1ValidatorModule(moduleInfo, signer)
    return instance
  }
}
