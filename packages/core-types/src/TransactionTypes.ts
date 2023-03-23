import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { OperationType } from './Types'
import { SmartAccountContext, SmartAccountState } from './SmartAccountTypes'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'
import { ContractTransaction } from '@ethersproject/contracts'

export type RawTransactionType = {
  from?: string
  gasPrice?: string | BigNumber
  maxFeePerGas?: string | BigNumber
  maxPriorityFeePerGas?: string | BigNumber
  gasLimit?: string
  to: string
  value?: BigNumberish
  data?: string
  chainId: number
  nonce?: number | string
  // accessList?: AccessListItem[];
  type?: number
}

export type Transaction = {
  to: string
  value?: BigNumberish
  data?: string
  nonce?: BigNumberish
  gasLimit?: BigNumberish
  // delegateCall?: boolean
  // revertOnError?: boolean
}
export type SignedTransaction = {
  rawTx: RawTransactionType
  tx: IWalletTransaction
}

export type ExecTransaction = {
  to: string
  value: BigNumberish
  data: string
  operation: number
  targetTxGas: string | number
}

export type SmartAccountSignature = {
  signer: string
  data: string
}

export interface IFeeRefundV1_0_0 {
  // gasUsed: string | number
  baseGas: string | number
  gasPrice: string | number
  gasToken: string
  refundReceiver: string
}
export interface IFeeRefundV1_0_1 extends IFeeRefundV1_0_0 {
  tokenGasPriceFactor: string | number
}

// extended from FeeRefund as we need this for handlePayment Estimate
export interface IFeeRefundHandlePayment extends IFeeRefundV1_0_1 {
  gasUsed: string | number
}

export type MetaTransactionData = {
  readonly to: string
  readonly value: BigNumberish
  readonly data: string
  readonly operation?: OperationType
}
export interface IMetaTransaction {
  to: string
  value: BigNumberish
  data: string
  operation: number
}

export interface IWalletTransaction extends IMetaTransaction {
  targetTxGas: string | number
  baseGas: string | number
  gasPrice: string | number
  gasToken: string
  tokenGasPriceFactor: string | number
  refundReceiver: string
  nonce: number
}

export type Signature = {
  readonly signer: string
  readonly data: string
  staticPart(): string
  dynamicPart(): string
}

export type TransactionOptions = {
  from?: string
  gas?: number | string
  gasLimit?: number | string
  gasPrice?: number | string
}

export interface IBaseTransactionResult {
  hash: string
}

export interface ITransactionResult extends IBaseTransactionResult {
  promiEvent?: PromiEvent<TransactionReceipt>
  transactionResponse?: ContractTransaction
  options?: TransactionOptions
}

export type RelayTransaction = {
  signedTx: SignedTransaction
  config: SmartAccountState
  context: SmartAccountContext
  gasLimit?: GasLimit
}

export type GasLimit = {
  hex: string
  type: string
}

export type DeployWallet = {
  config: SmartAccountState
  context: SmartAccountContext
  index: number
}
