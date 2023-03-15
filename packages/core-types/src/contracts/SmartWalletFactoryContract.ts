import { ITransactionResult } from '../TransactionTypes'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
export interface SmartWalletFactoryContract {
  getInterface(): Interface
  getAddress(): string
  getContract(): Contract
  deployCounterFactualWallet(
    owner: string,
    index: number
  ): Promise<ITransactionResult>
  deployWallet(owner: string): Promise<ITransactionResult>
  getAddressForCounterfactualWallet(owner: string, index: number): Promise<string>
}
