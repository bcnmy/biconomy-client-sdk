import {
  FeeRefundData,
  Transaction,
  SmartAccountTrxData,
  SmartAccountVersion,
  TransactionOptions,
  TransactionResult
} from '../types'

export interface SmartWalletContract {
  getVersion(): Promise<SmartAccountVersion>
  getAddress(): string
  getNonce(): Promise<number>
  getTransactionHash(smartAccountTrxData: SmartAccountTrxData): Promise<string>
  getModulesPaginated(start: string, pageSize: number): Promise<string[]>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
  execTransaction(
    transaction: Transaction,
    batchId: number,
    feeRefundData: FeeRefundData
  ): Promise<TransactionResult>
  encode(methodName: string, params: any): string
  estimateGas(methodName: string, params: any[], options: TransactionOptions): Promise<number>
}
