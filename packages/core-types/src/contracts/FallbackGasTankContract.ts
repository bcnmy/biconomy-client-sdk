import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'

export interface FallbackGasTankContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
}
