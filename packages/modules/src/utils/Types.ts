import { ChainId, UserOperation } from '@biconomy-devx/core-types'
import { Signer } from 'ethers'
import { SessionKeyManagerModule } from '../SessionKeyManagerModule'

export type ModuleVersion = 'V1_0_0' // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  entryPointAddress?: string
}

export interface ECDSAOwnershipValidationModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: string
  version?: ModuleVersion
  signer: Signer
}

export interface SessionKeyManagerModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: string
  version?: ModuleVersion
  // Review
  // sessionSigner?: Signer
  // sessionPubKey?: string
  nodeClientUrl?: string
  smartAccountAddress: string
  storageType?: StorageType
}

export interface BatchedSessionRouterModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: string
  version?: ModuleVersion

  sessionKeyManagerModule?: SessionKeyManagerModule // could be BaseValidationModule

  sessionManagerModuleAddress?: string
  nodeClientUrl?: string
  smartAccountAddress: string
  storageType?: StorageType

  // sessionSigner?: Signer
  // sessionPubKey?: string
  // nodeClientUrl?: string
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

export type ModuleInfo = {
  // Could be a full object of below params and that way it can be an array too!
  // sessionParams?: SessionParams[] // where SessionParams is below four
  sessionID?: string
  sessionSigner?: Signer
  sessionValidationModule?: string
  additionalSessionData?: string
  batchSessionParams?: SessionParams[]
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
