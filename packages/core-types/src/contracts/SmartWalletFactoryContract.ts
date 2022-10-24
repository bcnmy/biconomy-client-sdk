import { ITransactionResult } from '../transaction.types'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
export interface SmartWalletFactoryContract {
  getInterface(): Interface
  getAddress(): string
  getContract(): Contract
  isWalletExist(wallet: string): Promise<boolean>
  deployCounterFactualWallet(
    owner: string,
    entryPoint: string,
    handler: string,
    index: number
  ): Promise<ITransactionResult>
  deployWallet(owner: string, entryPoint: string, handler: string): Promise<ITransactionResult>
  getAddressForCounterfactualWallet(owner: string, index: number): Promise<string>
}
