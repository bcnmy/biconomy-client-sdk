import { BytesLike, Wallet, BigNumberish } from 'ethers'
import { ChainNames, ChainId } from '@biconomy-sdk/core-types'
import { Web3Provider } from '@ethersproject/providers'
import { ProviderUrlConfig } from '@biconomy-sdk/node-client'

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
