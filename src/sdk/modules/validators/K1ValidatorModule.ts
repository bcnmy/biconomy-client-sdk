import addresses from "../../__contracts/addresses.js"
import type { Holder } from "../../account/utils/toHolder.js"
import type { Module } from "../../clients/decorators/erc7579/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"

export class K1ValidatorModule extends BaseValidationModule {
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  public constructor(moduleConfig: Module, holder: Holder) {
    super(moduleConfig, holder)
  }

  public static async create(
    holder: Holder,
    k1ValidatorAddress = addresses.K1Validator
  ): Promise<K1ValidatorModule> {
    const module: Module = {
      address: k1ValidatorAddress,
      type: "validator",
      context: holder.address,
      additionalContext: "0x"
    }
    const instance = new K1ValidatorModule(module, holder)
    return instance
  }
}
