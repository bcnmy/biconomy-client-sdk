import { Transaction, ChainId, FeeQuote } from '@biconomy/core-types'

export type GetFeeQuotesDto = {
  version: string
  transaction: Transaction
  chainId: ChainId
}

export type GetFeeQuotesForBatchDto = {
  version: string
  transactions: Transaction[]
  chainId: ChainId
}

export type CreateUserPaidTransactionDto = {
  version: string
  transaction: Transaction
  feeQuote: FeeQuote
  chainId: ChainId,
  skipEstimation: boolean
}
export type CreateUserPaidTransactionBatchDto = {
  version: string
  transactions: Transaction[]
  feeQuote: FeeQuote
  chainId: ChainId,
  skipEstimation: boolean
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
