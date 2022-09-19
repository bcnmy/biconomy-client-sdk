// Smart Account Detail Param Types

import { ChainId } from './chains.types'
import { WalletTransaction, Transaction } from './transaction.types'
import { FeeQuote } from './types'
import { SmartWalletFactoryContract } from './contracts/SmartWalletFactoryContract'
import { MultiSendContract } from './contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from './contracts/MultiSendCallOnlyContract'
import { SmartWalletContract } from './contracts/SmartWalletContract'
import { GasLimit } from './transaction.types'

export interface SmartAccountContext {
  baseWallet: SmartWalletContract
  walletFactory: SmartWalletFactoryContract
  multiSend: MultiSendContract
  multiSendCall: MultiSendCallOnlyContract
}

export interface SmartAccountState {
  address: string
  owner: string
  isDeployed: boolean
  entryPointAddress: string
  fallbackHandlerAddress: string
}

export type AddressForCounterFactualWalletDto = {
  index: number
  chainId?: ChainId
}

export type SignTransactionDto = {
  tx: WalletTransaction
  chainId?: ChainId
}

export type SendTransactionDto = {
  tx: WalletTransaction
  batchId?: number
  chainId?: ChainId
  gasLimit?: GasLimit
}

export type PrepareRefundTransactionDto = {
  transaction: Transaction
  batchId?: number
  chainId?: ChainId
}

export type PrepareRefundTransactionsDto = {
  transactions: Transaction[]
  batchId?: number
  chainId?: ChainId
}

export type RefundTransactionDto = {
  transaction: Transaction
  feeQuote: FeeQuote
  batchId?: number
  chainId?: ChainId
}
export type RefundTransactionBatchDto = {
  transactions: Transaction[]
  feeQuote: FeeQuote
  batchId?: number
  chainId?: ChainId
}

export type TransactionDto = {
  transaction: Transaction
  batchId?: number
  chainId?: ChainId
}

export type TransactionBatchDto = {
  transactions: Transaction[]
  batchId?: number
  chainId?: ChainId
}
