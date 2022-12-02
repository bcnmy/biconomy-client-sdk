// Smart Account Detail Param Types

import { ChainId } from './ChainsTypes'
import { IWalletTransaction, Transaction } from './TransactionTypes'
import { FeeQuote } from './Types'
import { SmartWalletFactoryContract } from './contracts/SmartWalletFactoryContract'
import { MultiSendContract } from './contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from './contracts/MultiSendCallOnlyContract'
import { SmartWalletContract } from './contracts/SmartWalletContract'
import { GasLimit } from './TransactionTypes'
import { Signer } from 'ethers'
import { IPaymasterAPI } from 'AccountAbstractionTypes'

export interface SmartAccountConfig {
  activeNetworkId: ChainId
  supportedNetworksIds: ChainId[]
  backendUrl: string
  relayerUrl: string
  socketServerUrl: string // specific to biconomy messaging sdk
  signType: SignTypeMethod
  networkConfig: NetworkConfig[]
  entryPointAddress?: string
  biconomySigningServiceUrl?: string
  bundlerUrl?: string
  debug?: boolean
}

export enum SignTypeMethod {
  PERSONAL_SIGN = 'PERSONAL_SIGN',
  EIP712_SIGN = 'EIP712_SIGN'
}

export type NetworkConfig = {
  chainId: ChainId
  providerUrl?: string // review
  bundlerUrl?: string
  customPaymasterAPI?: IPaymasterAPI
  dappAPIKey?: string
}

export type SmartAccountContext = {
  baseWallet: SmartWalletContract
  walletFactory: SmartWalletFactoryContract
  multiSend: MultiSendContract
  multiSendCall: MultiSendCallOnlyContract
}

export type EstimateSmartAccountDeploymentDto = {
  chainId: ChainId
  version: string
  owner: string
  entryPointAddress: string
  fallbackHandlerAddress: string
}

export type SmartAccountState = {
  chainId: ChainId
  version: string
  address: string // multichain (EVM)
  owner: string // multichain (EVM)
  isDeployed: boolean // chain specific
  entryPointAddress: string // chain specific?
  fallbackHandlerAddress: string // chain specific?
}

// Review for optional
export type AddressForCounterFactualWalletDto = {
  index: number
  chainId: ChainId
  version: string
}

export type SignTransactionDto = {
  version?: string
  tx: IWalletTransaction
  chainId?: ChainId
  signer: Signer
}

export type SendTransactionDto = {
  tx: IWalletTransaction
  batchId?: number
  chainId?: ChainId
  gasLimit?: GasLimit
}

export type SendSignedTransactionDto = {
  tx: IWalletTransaction
  batchId?: number
  chainId?: ChainId
  gasLimit?: GasLimit
  signature: string
}

export type PrepareRefundTransactionDto = {
  version?: string
  transaction: Transaction
  batchId?: number
  chainId?: ChainId
}

export type PrepareRefundTransactionsDto = {
  version?: string
  transactions: Transaction[]
  batchId?: number
  chainId?: ChainId
}

export type RefundTransactionDto = {
  version?: string
  transaction: Transaction
  feeQuote: FeeQuote
  batchId?: number
  chainId?: ChainId
}
export type RefundTransactionBatchDto = {
  version?: string
  transactions: Transaction[]
  feeQuote: FeeQuote
  batchId?: number
  chainId?: ChainId
}

export type TransactionDto = {
  version?: string
  transaction: Transaction
  batchId?: number
  chainId?: ChainId
}

export type TransactionBatchDto = {
  version?: string
  transactions: Transaction[]
  batchId?: number
  chainId?: ChainId
}
