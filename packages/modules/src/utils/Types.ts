import { ChainId } from '@biconomy/core-types'
import { Signer } from 'ethers'

export interface BaseValidationModuleConfig {
  moduleAddress: string
  version?: string
  entrypointAddress?: string
}

export interface ECDSAOwnershipValidationModuleConfig extends BaseValidationModuleConfig {
  signer: Signer
  chainId: ChainId
}

export interface SessionKeyManagerModuleConfig extends BaseValidationModuleConfig {
  signer?: Signer
  sessionPubKey: string
  chainId: ChainId
}

export interface MultiChainValidationModuleConfig extends BaseValidationModuleConfig {
  signer: Signer
  chainId: ChainId
}
