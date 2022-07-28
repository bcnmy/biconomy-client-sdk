import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
export interface MultiSendContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
  encode(methodName: any, params: any): string
}
