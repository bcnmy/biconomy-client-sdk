import {
  FeeRefundData,
  SmartAccountTrx,
  SmartAccountTrxData,
  SmartAccountVersion,
  TransactionOptions,
  TransactionResult
} from '../types'
import { BigNumber } from '@ethersproject/bignumber'

export interface SmartWalletContract {
  getAddress(): string
  getOwner(): Promise<string>
  getVersion(): Promise<SmartAccountVersion>
  getNonce(batchId: number): Promise<BigNumber>
  getTransactionHash(smartAccountTrxData: SmartAccountTrxData): Promise<string>
  execTransaction(
    transaction: SmartAccountTrx,
    batchId: number,
    feeRefundData: FeeRefundData,
    options: TransactionOptions
  ): Promise<TransactionResult>
  encode(methodName: string, params: any): string
}
