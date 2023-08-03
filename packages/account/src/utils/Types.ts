import { Signer } from 'ethers'
import { ChainId } from '@biconomy/core-types'
import { BigNumberish } from 'ethers'
import { IBundler } from '@biconomy/bundler'
import { IPaymaster, PaymasterFeeQuote } from '@biconomy/paymaster'
import { BaseValidationModule } from '@biconomy/modules'

export type EntrypointAddresses = {
  [address: string]: string
}

export type BiconomyFactories = {
  [address: string]: string
}

export type BiconomyImplementations = {
  [address: string]: string
}

// Base Account API params
export interface BaseSmartAccountConfig {
  entryPointAddress: string
  bundler?: IBundler // equivalent to HttpRpcClient

  // TODO
  // Take the MUST below from below all comments

  // May use here or in extensions
  // provider: Provider
  // accountAddress?: string
  // overheads?: Partial<GasOverheads>
  // paymasterAPI?: PaymasterAPI
}

// Infinitism equivalent for above
/*export interface BaseApiParams {
  provider: Provider
  entryPointAddress: string
  accountAddress?: string
  overheads?: Partial<GasOverheads>
  paymasterAPI?: PaymasterAPI

  // Maybe
  owner: Signer
  index?: number
  httpRpcClient?: HttpRpcClient
  chainId?: number
}*/

/*export interface SimpleAccountApiParams extends BaseApiParams {
  owner: Signer
  factoryAddress?: string
  index?: BigNumberish
}*/

export interface BiconomySmartAccountConfig extends BaseSmartAccountConfig {
  signer: Signer // owner = signer and actual owner field is the address.
  rpcUrl?: string // as good as Provider
  chainId: ChainId // If optional can be extracted using rpcUrl / Provider
  paymaster?: IPaymaster // as good as PaymasterAPI. could maybe name the same for modular consistency
  nodeClientUrl?: string // very specific to Biconomy

  // index?: number // Would apply to any/most account factory
  // factoryAddress?: string // Good to have. Will evaluate if needed
}

export interface BiconomySmartAccountV2Config extends BiconomySmartAccountConfig {
  // can be replaced with interface once/if defined
  defaultValidationModule?: BaseValidationModule
  validationModule?: BaseValidationModule
}

export type BiconomyTokenPaymasterRequest = {
  feeQuote: PaymasterFeeQuote
  spender: string
  maxApproval?: boolean
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

// Note: May not apply for all Account implementaions V 1,2,3
export type InitilizationData = {
  accountIndex?: number
  signerAddress?: string
}
