import type { Address, Hex } from "viem"
import type { SmartAccountSigner } from "../../account/index.js"
import type { Module } from "../../clients/decorators/erc7579/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"

export class ValidationModule extends BaseValidationModule {
  private constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner,
    address: Address,
    context: Hex
  ): Promise<ValidationModule> {
    const module: Module = {
      address,
      type: "validator",
      context,
      additionalContext: "0x"
    }
    const instance = new ValidationModule(module, signer)
    return instance
  }
}
