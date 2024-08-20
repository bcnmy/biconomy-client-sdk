import type { Address, Hex } from "viem"
import { type SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { Module } from "../utils/Types.js"

export class ValidationModule extends BaseValidationModule {
  private constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner,
    moduleAddress: Address,
    data: Hex
  ): Promise<ValidationModule> {
    const module: Module = {
      module: moduleAddress,
      type: 'validator',
      data,
      additionalContext: "0x"
    }
    const instance = new ValidationModule(module, signer)
    return instance
  }
}
