import { Signer } from 'ethers'
import { ChainId } from '@biconomy/core-types'
import { BigNumberish } from 'ethers'
import { IBundler } from '@biconomy/bundler'
import { IPaymaster, PaymasterFeeQuote } from '@biconomy/paymaster'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { GasOverheads } from './Preverificaiton'

export type EntrypointAddresses = {
  [address: string]: string
}

export type BiconomyFactories = {
  [address: string]: string
}

export type BiconomyImplementation = {
  [address: string]: string
}

export type SmartAccountConfig = {
  entryPointAddress: string
  bundler?: IBundler
}

export interface BaseSmartAccountConfig {
  // owner?: Signer // can be in child classes
  index?: number
  provider: Provider
  entryPointAddress: string
  accountAddress?: string
  overheads?: Partial<GasOverheads>
  paymaster?: IPaymaster // PaymasterAPI
  bundler?: IBundler // like HttpRpcClient
  chainId: ChainId
}

export type BiconomyTokenPaymasterRequest = {
  feeQuote: PaymasterFeeQuote
  spender: string
  maxApproval?: boolean
}

export type BiconomySmartAccountConfig = {
  signer: Signer
  rpcUrl?: string
  chainId: ChainId
  entryPointAddress?: string
  bundler?: IBundler
  paymaster?: IPaymaster
  nodeClientUrl?: string
}

export interface BiconomySmartAccountV2Config extends BaseSmartAccountConfig {
  factoryAddress?: string
  rpcUrl?: string // as good as Provider
  nodeClientUrl?: string // very specific to Biconomy
  defaultValidationModule?: any // for now // BaseValidationModule
  activeValidationModule?: any // for now // BaseValidationModule
}

export type Overrides = {
  callGasLimit?: BigNumberish
  verificationGasLimit?: BigNumberish
  preVerificationGas?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
  paymasterData?: string
  signature?: string
}

export type InitilizationData = {
  accountIndex?: number
  signerAddress?: string
}

export type InitializeV2Data = {
  accountIndex?: number
}

export interface TransactionDetailsForUserOp {
  target: string
  data: string
  value?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
  nonce?: BigNumberish
}
