import { Transaction, ChainId, FeeQuote } from '@biconomy-sdk/core-types'

export type PrepareRefundTransactionDto = {
  version: string
  transaction: Transaction
  batchId: number
  chainId: ChainId
}

export type PrepareRefundTransactionsDto = {
  version: string
  transactions: Transaction[]
  batchId: number
  chainId: ChainId
}

export type RefundTransactionDto = {
  version: string
  transaction: Transaction
  feeQuote: FeeQuote
  batchId: number
  chainId: ChainId
}
export type RefundTransactionBatchDto = {
  version: string
  transactions: Transaction[]
  feeQuote: FeeQuote
  batchId: number
  chainId: ChainId
}

export type TransactionDto = {
  version: string
  transaction: Transaction
  batchId: number
  chainId: ChainId
}

export type TransactionBatchDto = {
  version: string
  transactions: Transaction[]
  batchId: number
  chainId: ChainId
}
