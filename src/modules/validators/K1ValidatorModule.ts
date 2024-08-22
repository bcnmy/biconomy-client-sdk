import type { Address } from "viem"
import type { SmartAccountSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { Module } from "../utils/Types.js"

export class K1ValidatorModule extends BaseValidationModule {
  private constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner,
    k1ValidatorAddress: Address
  ): Promise<K1ValidatorModule> {
    const module: Module = {
      moduleAddress: k1ValidatorAddress,
      type: "validator",
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    return new K1ValidatorModule(module, signer)
  }
}
