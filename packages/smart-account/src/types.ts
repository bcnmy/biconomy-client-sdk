import { BytesLike, Wallet, BigNumberish } from 'ethers'
import { ChainNames, ChainId } from '@biconomy-sdk/core-types'
import { Web3Provider } from '@ethersproject/providers'

// walletProvider: WalletProviderLike
// TODO : Ability to provide custom URLs for all supported networks
// TODO : Provide optional dapp api key for managed paymasters dashboard 
// relayer_url
export interface SmartAccountConfig {
  activeNetworkId: ChainId // same
  supportedNetworksIds: ChainId[] // Network[] chainId: CbainId, rpcUrl?: string
  backend_url: string
}


export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Reference
export interface WalletProvider {
  readonly type?: string
  readonly wallet?: Wallet
  readonly address: string
  readonly chainName?: ChainNames
  signMessage(message: BytesLike): Promise<string>
}

export interface WalletLike {
  privateKey: string
}

export type WalletProviderLike = string | WalletLike | WalletProvider
