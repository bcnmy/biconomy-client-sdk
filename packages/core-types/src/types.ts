import { SmartWalletFactoryContract } from './contracts/SmartWalletFactoryContract'
import { MultiSendContract } from './contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from './contracts/MultiSendCallOnlyContract'
import { SmartWalletContract } from './contracts/SmartWalletContract'

export type SmartAccountVersion =  '1.0.2' | '1.0.1' | '1.0.0'

export enum OperationType {
  Call, // 0
  DelegateCall // 1
}

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
export interface FeeRefundData {
  readonly gasUsed: number
  readonly baseGas: number
  readonly gasPrice: number
  readonly tokenGasPriceFactor: string | number
  readonly gasToken: string
  readonly refundReceiver: string
}
export interface Eip3770Address {
  prefix: string
  address: string
}

export interface UserOperation {
  sender: string
  nonce: number
  initCode: string
  callData: string
  callGas: number
  verificationGas: number
  preVerificationGas: number
  maxFeePerGas: number
  maxPriorityFeePerGas: number
  paymaster: string
  paymasterData: string
  signature: string
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export interface RestRelayerOptions {
  url: string
}

export interface TokenData {
  tokenGasPrice: number, // review
  offset?: number, // review
  symbol: string,
  address: string, 
  decimal: number,
  logoUrl: string
}

export interface FeeQuote {
  symbol: string,
  address: string, 
  decimal: number,
  logoUrl: string,
  payment: number,
  tokenGasPrice: number, //review
  offset?: number,
}

export interface FeeOptionsResponse {
  msg: string,
  data: {
    chainId: number,
    response: Array<TokenData>
  }
}
export interface FeeOption {
  feeToken: string,
  tokenGasPrice: number | string, //review
  offset: number | string // review
}