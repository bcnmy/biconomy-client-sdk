import { ChainId } from '@biconomy/core-types'
import { EntrypointAddresses, BiconomyFactories, BiconomyImplementation } from './Types'

// Review : The way versioning mapping is kept here

// Review : v0_0_5 vs calling v1_0_0 for entry point (in typechain)
export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
export const ENTRYPOINT_ADDRESSES: EntrypointAddresses = {
  '0x27a4db290b89ae3373ce4313cbeae72112ae7da9': 'V0_0_5',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789': 'V0_0_6'
}

export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  '0x000061f727979a1bba002d6261623c76ee0ecf51': 'V1_0_0',
  '0x2642d30cebafeb1da6bc6e3c2cfce0e3199eff19': 'V2_0_0'
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementation = {
  '0x0000cc4a2bc176001e72a353f7660a7f59d78628': 'V1_0_0',
  '0xf1080f5f874ea8170e423738791e0e9a8aad87fd': 'V2_0_0'
}

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]
