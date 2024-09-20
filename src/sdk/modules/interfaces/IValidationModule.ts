import type { Hex } from "viem"
import type { Signer } from "../../account/utils/toSigner"

export interface IValidationModule {
  getAddress(): Hex
  getInitData(): Promise<Hex>
  getHolder(): Promise<Signer>
  signUserOpHash(_userOpHash: string): Promise<Hex>
  signMessage(_message: string | Uint8Array): Promise<string>
  getDummySignature(): Promise<Hex>
}
