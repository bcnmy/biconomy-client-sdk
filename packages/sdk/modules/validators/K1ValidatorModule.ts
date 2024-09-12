import addresses from "../../__contracts/addresses.js"
import type { SmartAccountSigner } from "../../account/index.js"
import type { Module } from "../../clients/decorators/erc7579/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"

export class K1ValidatorModule extends BaseValidationModule {
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  public constructor(moduleConfig: Module, signer: SmartAccountSigner) {
    super(moduleConfig, signer)
  }

  public static async create(
    signer: SmartAccountSigner,
    k1ValidatorAddress = addresses.K1Validator
  ): Promise<K1ValidatorModule> {
    const module: Module = {
      address: k1ValidatorAddress,
      type: "validator",
      context: await signer.getAddress(),
      additionalContext: "0x"
    }
    const instance = new K1ValidatorModule(module, signer)
    return instance
  }
}
