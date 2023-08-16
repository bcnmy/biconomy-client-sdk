import { EntryPoint_v100 } from '@biconomy/common'
import { Signer } from 'ethers'

export interface BaseValidationModuleConfig {
  moduleAddress: string
  // entryPoint: EntryPoint_v100 // instead of config can make this a member
  entrypointAddress?: string // Review: can accept entryPointAddress as for account we usually get from sdk backend config
  // enableSignature?: string
  validUntil?: number
  validAfter?: number
}

export interface ECDSAOwnershipValidationModuleConfig extends BaseValidationModuleConfig {
  // Review: Maybe rename to owner
  signer: Signer
  // Review
  entryPoint: EntryPoint_v100
  sessionKeyModule?: string
}
