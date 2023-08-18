import { ChainId } from '@biconomy/core-types'
import {
  EntrypointAddresses,
  BiconomyFactories,
  BiconomyImplementations,
  ENTRY_POINT_ADDRESSES_BY_VERSION,
  BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION,
  BICONOMY_FACTORY_ADDRESSES_BY_VERSION
} from './Types'

// Review: Note: Might be a good idea to keep reverse mapping for below and also default constants for latest versioned addresses*/

// will always be latest entrypoint address
export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
export const ENTRYPOINT_ADDRESSES: EntrypointAddresses = {
  '0x27a4db290b89ae3373ce4313cbeae72112ae7da9': 'V0_0_5',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789': 'V0_0_6'
}

// will always be latest factory address
export const DEFAULT_BICONOMY_FACTORY_ADDRESS = '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c'
export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c': 'V1_0_0',
  '0x2642d30cebafeb1da6bc6e3c2cfce0e3199eff19': 'V2_0_0'
}

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS = '0x00006b7e42e01957da540dc6a8f7c30c4d816af5'
export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementations = {
  '0x00006b7e42e01957da540dc6a8f7c30c4d816af5': 'V1_0_0',
  '0xf1080f5f874ea8170e423738791e0e9a8aad87fd': 'V2_0_0'
}

export const ENTRYPOINT_ADDRESSES_VERSIONED: ENTRY_POINT_ADDRESSES_BY_VERSION = {
  V0_0_5: '0x27a4db290b89ae3373ce4313cbeae72112ae7da9',
  V0_0_6: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
}

export const BICONOMY_FACTORY_ADDRESSES_VERSIONED: BICONOMY_FACTORY_ADDRESSES_BY_VERSION = {
  V1_0_0: '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c',
  V2_0_0: '0x2642d30cebafeb1da6bc6e3c2cfce0e3199eff19'
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES_VERSIONED: BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION =
  {
    V1_0_0: '0x00006b7e42e01957da540dc6a8f7c30c4d816af5',
    V2_0_0: '0xf1080f5f874ea8170e423738791e0e9a8aad87fd'
  }

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]
