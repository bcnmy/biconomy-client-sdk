import { BytesLike, Wallet, BigNumberish } from 'ethers'
import { ChainNames, ChainId } from '@biconomy-sdk/core-types'
import { Web3Provider } from '@ethersproject/providers'

// walletProvider: WalletProviderLike
// TODO : Ability to provide custom URLs for all supported networks
export interface SmartAccountConfig {
  activeNetworkId: ChainId // same
  supportedNetworksIds: ChainId[] // Network[] chainId: CbainId, rpcUrl?: string
  backend_url: string
}
// relayer_url

// TODO
// Review location, usage and name of types @chirag
// Should be kept in native types and the moment it needs to be shared by other package, move to core types and use from there
// export interface MetaTransaction {
//   to: string
//   value?: BigNumberish
//   data?: string
//   nonce?: BigNumberish
//   gasLimit?: BigNumberish
//   // delegateCall?: boolean
//   // revertOnError?: boolean
// }

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// reference i could work on
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
