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
export const DEFAULT_BICONOMY_FACTORY_ADDRESS = '0x00000016FD385cEE5116EF68C189733679770338'
export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c': 'V1_0_0',
  '0xd4450c80F6D0518a987144e44CEd55ec9CbC7805': 'V2_0_0'
}

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS = '0x000000988555091db5633a5Be66d563EfB48cB95'
export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementations = {
  '0x00006b7e42e01957da540dc6a8f7c30c4d816af5': 'V1_0_0',
  '0x000000988555091db5633a5Be66d563EfB48cB95': 'V2_0_0'
}

export const ENTRYPOINT_ADDRESSES_BY_VERSION: EntryPointAddressesByVersion = {
  V0_0_5: '0x27a4db290b89ae3373ce4313cbeae72112ae7da9',
  V0_0_6: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
}

export const BICONOMY_FACTORY_ADDRESSES_BY_VERSION: BiconomyFactoriesByVersion = {
  V1_0_0: '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c',
  V2_0_0: '0x00000016FD385cEE5116EF68C189733679770338'
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION: BiconomyImplementationsByVersion = {
  V1_0_0: '0x00006b7e42e01957da540dc6a8f7c30c4d816af5',
  V2_0_0: '0x000000988555091db5633a5Be66d563EfB48cB95'
}

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]
