import { ChainId } from '@biconomy/core-types';
import { EntrypointAddresses, BiconomyFactories, BiconomyImplementation } from './Types';

// will always be latest entrypoint address
export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';
export const ENTRYPOINT_ADDRESSES: EntrypointAddresses = {
  '0x27a4db290b89ae3373ce4313cbeae72112ae7da9': 'V0_0_5',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789': 'V0_0_6'
};

// will always be latest factory address
export const DEFAULT_BICONOMY_FACTORY_ADDRESS = '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c';
export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  '0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c': 'V1_0_0'
};

export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementation = {
  '0x00006b7e42e01957da540dc6a8f7c30c4d816af5': 'V1_0_0'
};

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS = '0x00006b7e42e01957da540dc6a8f7c30c4d816af5';

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101];
