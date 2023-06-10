import { Signer } from 'ethers'
import { ChainId } from '@biconomy/core-types'
import { BigNumberish } from 'ethers'
import { IBundler } from '@biconomy/bundler'
import { IPaymaster } from '@biconomy/paymaster'

export type SmartAccountConfig = {
  entryPointAddress: string
  bundler?: IBundler
}

export type BiconomySmartAccountConfig = {
  signer: Signer
  rpcUrl?: string
  chainId: ChainId
  entryPointAddress?: string
  factoryAddress?: string
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
}
