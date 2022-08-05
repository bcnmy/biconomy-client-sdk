import { SmartWalletFactoryContract } from './contracts/SmartWalletFactoryContract'
import { MultiSendContract } from './contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from './contracts/MultiSendCallOnlyContract'
import { SmartWalletContract } from './contracts/SmartWalletContract'
import { BigNumber, BigNumberish } from 'ethers'

export type SmartAccountVersion = '1.3.0' | '1.2.0' | '1.1.1'

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
  readonly baseGas: number
  readonly gasPrice: number
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
