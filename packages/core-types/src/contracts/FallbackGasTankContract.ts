import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'

export interface FallbackGasTankContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
}
