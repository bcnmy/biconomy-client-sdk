import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'

export interface FallbackGasTankContract {
  getAddress(): string
  getContract(): Contract
  getBalance(_dappIdentifier: string): Promise<BigNumber>
  getNonce(_sender: string): Promise<BigNumber>
  getHash(fallbackUserOp: any): Promise<string>
  getInterface(): Interface
}
