import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { OperationType, SmartAccountContext, SmartAccountState } from './types'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'
import { ContractTransaction } from '@ethersproject/contracts'

export interface RawTransactionType {
  from?: string
  gasPrice?: string | BigNumber
  maxFeePerGas?: string | BigNumber
  maxPriorityFeePerGas?: string | BigNumber
  gasLimit?: string
  to: string
  value: BigNumberish
  data?: string
  chainId: number
  nonce?: number | string
  // accessList?: AccessListItem[];
  type?: number
}

export interface Transaction {
  to: string
  value?: BigNumberish
  data?: string
  nonce?: BigNumberish
  gasLimit?: BigNumberish
  // delegateCall?: boolean
  // revertOnError?: boolean
}
export interface SignedTransaction {
  rawTx: RawTransactionType
  tx: WalletTransaction
}

export interface ExecTransaction {
  to: string
  value: BigNumberish
  data: string
  operation: number
  targetTxGas: string | number
}

export interface SmartAccountSignature {
  signer: string
  data: string
}

export interface FeeRefundV1_0_0 {
  // gasUsed: string | number
  baseGas: string | number
  gasPrice: string | number
  gasToken: string
  refundReceiver: string
}
export interface FeeRefundV1_0_1 extends FeeRefundV1_0_0{
  tokenGasPriceFactor: string | number
}


// extended from FeeRefund as we need this for handlePayment Estimate
export interface FeeRefundHandlePayment extends FeeRefundV1_0_1 {
  gasUsed: string | number
}

export interface MetaTransactionData {
  readonly to: string
  readonly value: BigNumberish
  readonly data: string
  readonly operation?: OperationType
}

// export interface SmartAccountTrxData extends MetaTransactionData {
//   readonly operation: OperationType
//   readonly targetTxGas: number
//   readonly baseGas: number
//   readonly gasPrice: number
//   readonly gasToken: string
//   readonly refundReceiver: string
//   readonly nonce: number
// }

// export interface SmartAccountTrxDataPartial extends MetaTransactionData {
//   readonly targetTxGas?: number
//   readonly baseGas?: number
//   readonly gasPrice?: number
//   readonly gasToken?: string
//   readonly refundReceiver?: string
//   readonly nonce?: number
// }
export interface MetaTransaction {
  to: string
  value: BigNumberish
  data: string
  operation: number
}

export interface WalletTransaction extends MetaTransaction {
  targetTxGas: string | number
  baseGas: string | number
  gasPrice: string | number
  gasToken: string
  tokenGasPriceFactor: string | number
  refundReceiver: string
  nonce: number
}

export interface Signature {
  readonly signer: string
  readonly data: string
  staticPart(): string
  dynamicPart(): string
}

// export interface SmartAccountTrx {
//   readonly data: Transaction
//   readonly signatures: Map<string, Signature>
//   addSignature(signature: Signature): void
//   encodedSignatures(): string
// }

// export interface Transaction {
//   readonly to: string
//   readonly value: string
//   readonly data: string
//   readonly operation: OperationType
//   readonly targetTxGas: number
// }

export interface TransactionOptions {
  from?: string
  gas?: number | string
  gasLimit?: number | string
  gasPrice?: number | string
}

export interface BaseTransactionResult {
  hash: string
}

export interface TransactionResult extends BaseTransactionResult {
  promiEvent?: PromiEvent<TransactionReceipt>
  transactionResponse?: ContractTransaction
  options?: TransactionOptions
}

export interface RelayTransaction {
  signedTx: SignedTransaction
  config: SmartAccountState
  context: SmartAccountContext
  gasLimit?: GasLimit
}

export interface GasLimit {
  hex: string,
  type: string
}

export interface DeployWallet {
  config: SmartAccountState
  context: SmartAccountContext
  index: number
}
