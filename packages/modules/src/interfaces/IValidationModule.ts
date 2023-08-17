import { Signer } from 'ethers'
import { UserOperation } from '@biconomy/core-types'
import { Bytes } from 'ethers/lib/utils'

export interface IValidationModule {
  getAddress(): Promise<string>
  getInitData(): Promise<string>
  getSigner(): Promise<Signer>
  signUserOp(userOp: UserOperation): Promise<string>
  signMessage(message: Bytes | string): Promise<string>
  getDummySignature(): string
}
