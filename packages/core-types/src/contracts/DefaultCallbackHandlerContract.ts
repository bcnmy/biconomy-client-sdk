import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
import { BytesLike } from 'ethers'
export interface DefaultCallbackHandlerContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
  getMessageHash(message: BytesLike): Promise<string>
  isValidSignature(_dataHash: string, _signature: string): Promise<BytesLike>
}
