
import {
  TransactionResult
} from '../types'
export interface SmartWalletFacoryContract {
    deployCounterFactualWallet(owner:string, entryPointL:string, handler:string, index:number): Promise<TransactionResult>
    deployWallet(owner:string, entryPointL:string, handler:string): Promise<TransactionResult>
    getAddressForCounterfactualWallet(owner:string, index:number): Promise<string>
  }
  