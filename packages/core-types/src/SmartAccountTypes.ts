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
import { IPaymasterAPI } from './AccountAbstractionTypes'

export enum Environments {
  DEV = 'DEVELOPMENT', // Strictly testnets
  QA = 'STAGING', // Teset networks staging
  PROD = 'PRODUCTION' // Has all mainnet and testnet config
}

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
  strictSponsorshipMode?: boolean
  bundlerUrl?: string
  environment?: Environments
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
}

export type SmartAccountState = {
  chainId: ChainId
  version: string
  address: string // multichain (EVM)
  owner: string // multichain (EVM)
  isDeployed: boolean // chain specific
  entryPointAddress: string // chain specific?
  implementationAddress: string
  fallbackHandlerAddress: string // chain specific?
}

// Review for optional
export type AddressForCounterFactualWalletDto = {
  index: number
  chainId: ChainId
  version: string
}

export type InitializerDto = {
  index?: number
  chainId: ChainId
  version?: string
  owner: string
  txServiceUrl: string
}

export type SignUserPaidTransactionDto = {
  version?: string
  tx: IWalletTransaction
  chainId?: ChainId
  signer: Signer
}

export type SendUserPaidTransactionDto = {
  tx: IWalletTransaction
  chainId?: ChainId
  gasLimit?: GasLimit
}

export type SendUserPaidSignedTransactionDto = {
  tx: IWalletTransaction
  chainId?: ChainId
  gasLimit?: GasLimit
  signature: string
}

export type GetFeeQuotesDto = {
  version?: string
  transaction: Transaction
  chainId?: ChainId
}

export type GetFeeQuotesForBatchDto = {
  version?: string
  transactions: Transaction[]
  chainId?: ChainId
}

export type CreateUserPaidTransactionDto = {
  version?: string
  transaction: Transaction
  feeQuote: FeeQuote
  chainId?: ChainId
}
export type CreateUserPaidTransactionBatchDto = {
  version?: string
  transactions: Transaction[]
  feeQuote: FeeQuote
  chainId?: ChainId
}

export type TransactionDto = {
  version?: string
  transaction: Transaction
  chainId?: ChainId
}

export type TransactionBatchDto = {
  version?: string
  transactions: Transaction[]
  chainId?: ChainId
}

export enum SmartAccountType {
  BICONOMY
}
