// Smart Account Detail Param Types

import { ChainId } from './chains.types'
import { WalletTransaction, Transaction } from './transaction.types'
import { FeeQuote } from './types'
export type AddressForCounterFactualWalletDto = {
  index: number
  chainId: ChainId
}

export type SignTransactionDto = {
  tx: WalletTransaction
  chainId: ChainId
}

export type SendTransactionDto = {
  tx: WalletTransaction
  batchId: number
  chainId: ChainId
}

export type PrepareTransactionDto = {
  transaction: Transaction
  batchId: number
  chainId: ChainId
}

export type PrepareRefundTransactionDto = {
  transactions: Transaction[]
  batchId: number
  chainId: ChainId
}

export type RefundTransactionDto = {
  transaction: Transaction
  feeQuote: FeeQuote
  batchId: number
  chainId: ChainId
}
export type RefundTransactionBatchDto = {
  transactions: Transaction[]
  feeQuote: FeeQuote
  batchId: number
  chainId: ChainId
}

export type TransactionDto = {
  transaction: Transaction
  batchId: number
  chainId: ChainId
}

export type TransactionBatchDto = {
  transactions: Transaction[]
  batchId: number
  chainId: ChainId
}
