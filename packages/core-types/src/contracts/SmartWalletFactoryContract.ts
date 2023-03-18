import { ITransactionResult } from '../TransactionTypes'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
export interface SmartWalletFactoryContract {
  getInterface(): Interface
  getAddress(): string
  getContract(): Contract
  deployCounterFactualAccount(
    owner: string,
    index: number
  ): Promise<ITransactionResult>
  deployAccount(owner: string): Promise<ITransactionResult>
  getAddressForCounterFactualAccount(owner: string, index: number): Promise<string>
}
