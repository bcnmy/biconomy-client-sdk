import { ChainId } from '@biconomy/core-types'
import {
  EntryPointAddresses,
  BiconomyFactories,
  BiconomyImplementations,
  EntryPointAddressesByVersion,
  BiconomyFactoriesByVersion,
  BiconomyImplementationsByVersion
} from './Types'

// Review: Note: Might be a good idea to keep reverse mapping for below and also default constants for latest versioned addresses*/

// will always be latest entrypoint address
export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
export const ENTRYPOINT_ADDRESSES: EntryPointAddresses = {
  '0x27a4db290b89ae3373ce4313cbeae72112ae7da9': 'V0_0_5',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789': 'V0_0_6'
}

// will always be latest factory address
export const DEFAULT_BICONOMY_FACTORY_ADDRESS = '0xD8E65814d5F528fa573eF9bb5Aa22817DEE3E1bf'
export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c': 'V1_0_0',
  '0xD8E65814d5F528fa573eF9bb5Aa22817DEE3E1bf': 'V2_0_0'
}

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS = '0x9777a082B23C09f81cB23C2635cCb93603D1AF42'
export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementations = {
  '0x00006b7e42e01957da540dc6a8f7c30c4d816af5': 'V1_0_0',
  '0x9777a082B23C09f81cB23C2635cCb93603D1AF42': 'V2_0_0'
}

export const ENTRYPOINT_ADDRESSES_BY_VERSION: EntryPointAddressesByVersion = {
  V0_0_5: '0x27a4db290b89ae3373ce4313cbeae72112ae7da9',
  V0_0_6: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
}

export const BICONOMY_FACTORY_ADDRESSES_BY_VERSION: BiconomyFactoriesByVersion = {
  V1_0_0: '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c',
  V2_0_0: '0x2642d30cebafeb1da6bc6e3c2cfce0e3199eff19'
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION: BiconomyImplementationsByVersion = {
  V1_0_0: '0x00006b7e42e01957da540dc6a8f7c30c4d816af5',
  V2_0_0: '0xf1080f5f874ea8170e423738791e0e9a8aad87fd'
}

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]
