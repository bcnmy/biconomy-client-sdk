import {
  FeeRefundData,
  SmartAccountTrx,
  WalletTransaction,
  SmartAccountVersion,
  TransactionOptions,
  TransactionResult
} from '../types'
import { BigNumber } from '@ethersproject/bignumber'
import { Interface } from "@ethersproject/abi";


// TODO
// Rename
export interface SmartWalletContract {
  getAddress(): string
  getInterface(): Interface
  setAddress(address:string): any
  getOwner(): Promise<string>
  getVersion(): Promise<SmartAccountVersion>
  getNonce(batchId: number): Promise<BigNumber>
  getTransactionHash(smartAccountTrxData: WalletTransaction): Promise<string>
  execTransaction(
    transaction: SmartAccountTrx,
    batchId: number,
    feeRefundData: FeeRefundData,
    options: TransactionOptions
  ): Promise<TransactionResult>
  encode(methodName: string, params: any): string
}
