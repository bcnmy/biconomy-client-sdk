import type { Hex } from "viem"
import type { Holder } from "../../account/utils/toHolder"

export interface IValidationModule {
  getAddress(): Hex
  getInitData(): Promise<Hex>
  getHolder(): Promise<Holder>
  signUserOpHash(_userOpHash: string): Promise<Hex>
  signMessage(_message: string | Uint8Array): Promise<string>
  getDummySignature(): Promise<Hex>
}
