import type { Hex } from "viem"
import {
  DEFAULT_ENTRYPOINT_ADDRESS,
  fixPotentiallyIncorrectVForSignature,
  type SmartAccountSigner
} from "../account"
import type { IValidationModule } from "./interfaces/IValidationModule.js"
import type { BaseValidationModuleConfig, ModuleInfo } from "./utils/Types.js"

export abstract class BaseValidationModule implements IValidationModule {
  entryPointAddress: Hex

  constructor(moduleConfig: BaseValidationModuleConfig) {
    const { entryPointAddress } = moduleConfig

    this.entryPointAddress = entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS
  }

  abstract getAddress(): Hex

  setEntryPointAddress(entryPointAddress: Hex): void {
    this.entryPointAddress = entryPointAddress
  }

  abstract getInitData(): Promise<Hex>

  // Anything  required to get dummy signature can be passed as params
  abstract getDummySignature(_params?: ModuleInfo): Promise<Hex>

  abstract getSigner(): Promise<SmartAccountSigner>

  // Signer specific or any other additional information can be passed as params
  abstract signUserOpHash(
    _userOpHash: string,
    _params?: ModuleInfo
  ): Promise<Hex>

  abstract signMessage(_message: Uint8Array | string): Promise<string>

  async signMessageSmartAccountSigner(
    _message: string | Uint8Array,
    signer: SmartAccountSigner
  ): Promise<string> {
    const message = typeof _message === "string" ? _message : { raw: _message }
    let signature: Hex = await signer.signMessage(message)
    signature = fixPotentiallyIncorrectVForSignature(signature)

    return signature
  }
}
