import type { Hex } from "viem"
import type { SmartAccountSigner } from "../../account/utils/Types"

export interface IValidationModule {
  getAddress(): Hex
  getInitData(): Promise<Hex>
  getSigner(): Promise<SmartAccountSigner>
  signUserOpHash(_userOpHash: string): Promise<Hex>
  signMessage(_message: string | Uint8Array): Promise<string>
  getDummySignature(): Promise<Hex>
}
