import { Signer } from 'ethers'
import { ChainId } from '@biconomy/core-types'
import { BigNumberish } from 'ethers'
import { IBundler } from '@biconomy/bundler'
import { IPaymaster, PaymasterFeeQuote } from '@biconomy/paymaster'

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
