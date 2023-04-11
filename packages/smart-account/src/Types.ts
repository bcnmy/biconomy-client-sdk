import { BytesLike, Wallet } from 'ethers'
import { ChainNames } from '@biconomy-devx/core-types'

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
