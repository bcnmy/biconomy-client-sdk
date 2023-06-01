import { Signer } from 'ethers'
import { ChainId } from '@biconomy/core-types'
import { BigNumberish } from 'ethers'


export type SmartAccountConfig = {
  epAddress: string
  bundlerUrl?: string
}

export type BiconomySmartAccountConfig = {
  signer: Signer,
  rpcUrl?: string,
  chainId?: ChainId
  epAddress?: string
  factoryAddress?: string
  bundlerUrl?: string
  paymasterUrl?: string
  nodeClientUrl?: string,
  dappApiKey?: string,
  strictSponsorshipMode?: boolean
  userOpReceiptIntervals?: { [key in ChainId]?: number }
}

export type Overrides = {
  callGasLimit?: BigNumberish,
  verificationGasLimit?: BigNumberish,
  preVerificationGas?: BigNumberish,
  maxFeePerGas?: BigNumberish,
  maxPriorityFeePerGas?: BigNumberish
}
