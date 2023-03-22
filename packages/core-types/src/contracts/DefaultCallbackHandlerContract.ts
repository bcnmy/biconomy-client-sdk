import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
export interface DefaultCallbackHandlerContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
}
