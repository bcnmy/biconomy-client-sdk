import {
  FeeRefundData,
  SmartAccountTrx,
  SmartAccountTrxData,
  SmartAccountVersion,
  TransactionOptions,
  TransactionResult
} from '../types'

export interface SmartWalletContract {
  getVersion(): Promise<SmartAccountVersion>
  getNonce(batchId: number): Promise<number>
  getTransactionHash(smartAccountTrxData: SmartAccountTrxData): Promise<string>
  execTransaction(
    transaction: SmartAccountTrx,
    batchId: number,
    feeRefundData: FeeRefundData,
    options: TransactionOptions
  ): Promise<TransactionResult>
  encode(methodName: string, params: any): string
}
