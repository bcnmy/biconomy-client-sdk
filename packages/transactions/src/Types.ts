import { Transaction, ChainId, FeeQuote } from '@biconomy/core-types'

export type PrepareRefundTransactionDto = {
  version: string
  transaction: Transaction
  chainId: ChainId
}

export type PrepareRefundTransactionsDto = {
  version: string
  transactions: Transaction[]
  chainId: ChainId
}

export type RefundTransactionDto = {
  version: string
  transaction: Transaction
  feeQuote: FeeQuote
  chainId: ChainId
}
export type RefundTransactionBatchDto = {
  version: string
  transactions: Transaction[]
  feeQuote: FeeQuote
  chainId: ChainId
}

export type TransactionDto = {
  version: string
  transaction: Transaction
  chainId: ChainId
}

export type TransactionBatchDto = {
  version: string
  transactions: Transaction[]
  chainId: ChainId
}
