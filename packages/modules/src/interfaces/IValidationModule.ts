import { Signer } from 'ethers'
import { Bytes } from 'ethers/lib/utils'

export interface IValidationModule {
  getAddress(): string
  getInitData(): Promise<string>
  getSigner(): Promise<Signer>
  signUserOpHash(userOpHash: string): Promise<string>
  signMessage(message: Bytes | string): Promise<string>
  getDummySignature(): string
}
