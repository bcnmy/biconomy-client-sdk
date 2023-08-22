import { ChainId, UserOperation } from '@biconomy/core-types'
import { Signer } from 'ethers'

export type ModuleVersion = 'V1_0_0' // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  entryPointAddress?: string
}

export interface ECDSAOwnershipValidationModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: string
  version?: ModuleVersion
  signer: Signer
  chainId: ChainId
}

export interface SessionKeyManagerModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: string
  version?: ModuleVersion
  sessionSigner?: Signer
  sessionPubKey: string
  nodeClientUrl?: string
  chainId: ChainId
  smartAccountAddress: string
  storageType?: StorageType
}

export enum StorageType {
  LOCAL_STORAGE
}

export type SessionParams = {
  sessionID?: string
  sessionSigner: Signer
  sessionValidationModule?: string
  additionalSessionData?: string
}

export interface CreateSessionDataParams {
  validUntil: number
  validAfter: number
  sessionValidationModule: string
  sessionPublicKey: string
  sessionKeyData: string
}

export interface MultiChainValidationModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: string
  version?: ModuleVersion
  signer: Signer
}

export type MultiChainUserOpDto = {
  validUntil?: number
  validAfter?: number
  chainId: ChainId
  userOp: Partial<UserOperation>
}
