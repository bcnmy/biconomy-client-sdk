import { type SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { K1_VALIDATOR } from "../utils/Constants.js"
import type { Module } from "../utils/Types.js"

export class K1ValidatorModule extends BaseValidationModule {
  private constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner
  ): Promise<K1ValidatorModule> {
    const module: Module = {
      moduleAddress: K1_VALIDATOR,
      type: 'validator',
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    const instance = new K1ValidatorModule(module, signer)
    return instance
  }
}
