import type { Address, Hex } from "viem"
import type { Signer } from "../../account/utils/toSigner.js"
import type { Module } from "../../clients/decorators/erc7579/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"

export class ValidationModule extends BaseValidationModule {
  private constructor(moduleConfig: Module, signer: Signer) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: Signer,
    address: Address,
    data: Hex
  ): Promise<ValidationModule> {
    const module: Module = {
      address,
      type: "validator",
      data,
      additionalContext: "0x"
    }
    const instance = new ValidationModule(module, signer)
    return instance
  }
}
