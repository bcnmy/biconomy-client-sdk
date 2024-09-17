import type { Address, Hex } from "viem"
import type { Holder } from "../../account/utils/toHolder.js"
import type { Module } from "../../clients/decorators/erc7579/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"

export class ValidationModule extends BaseValidationModule {
  private constructor(moduleConfig: Module, holder: Holder) {
    super(moduleConfig, holder)
  }

  public static async create(
    holder: Holder,
    address: Address,
    context: Hex
  ): Promise<ValidationModule> {
    const module: Module = {
      address,
      type: "validator",
      context,
      additionalContext: "0x"
    }
    const instance = new ValidationModule(module, holder)
    return instance
  }
}
