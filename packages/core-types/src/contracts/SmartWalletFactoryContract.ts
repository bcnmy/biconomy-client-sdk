import { TransactionResult } from '../types'
import { Interface } from "@ethersproject/abi";
export interface SmartWalletFactoryContract {
  getInterface(): Interface
  getAddress(): string
  deployCounterFactualWallet(
    owner: string,
    entryPoint: string,
    handler: string,
    index: number
  ): Promise<TransactionResult>
  deployWallet(owner: string, entryPoint: string, handler: string): Promise<TransactionResult>
  getAddressForCounterfactualWallet(owner: string, index: number): Promise<string>
}
