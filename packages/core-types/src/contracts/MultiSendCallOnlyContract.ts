import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
export interface MultiSendCallOnlyContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  encode(methodName: any, params: any): string
}
