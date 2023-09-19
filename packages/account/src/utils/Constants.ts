import { ChainId } from "@biconomy/core-types";
import {
  EntryPointAddresses,
  BiconomyFactories,
  BiconomyImplementations,
  EntryPointAddressesByVersion,
  BiconomyFactoriesByVersion,
  BiconomyImplementationsByVersion,
} from "./Types";

// Review: Note: Might be a good idea to keep reverse mapping for below and also default constants for latest versioned addresses*/

// will always be latest entrypoint address
export const DEFAULT_ENTRYPOINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
export const ENTRYPOINT_ADDRESSES: EntryPointAddresses = {
  "0x27a4db290b89ae3373ce4313cbeae72112ae7da9": "V0_0_5",
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789": "V0_0_6",
};

// will always be latest factory address
export const DEFAULT_BICONOMY_FACTORY_ADDRESS = "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5";
export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  "0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c": "V1_0_0",
  "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5": "V2_0_0",
};

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS = "0x0000002512019Dafb59528B82CB92D3c5D2423aC";
export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementations = {
  "0x00006b7e42e01957da540dc6a8f7c30c4d816af5": "V1_0_0",
  "0x0000002512019Dafb59528B82CB92D3c5D2423aC": "V2_0_0",
};

export const ENTRYPOINT_ADDRESSES_BY_VERSION: EntryPointAddressesByVersion = {
  V0_0_5: "0x27a4db290b89ae3373ce4313cbeae72112ae7da9",
  V0_0_6: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
};

// TODO // Update with latest factory address
// make use of BICONOMY_FACTORY_ADDRESSES to create reverse mapping here
export const BICONOMY_FACTORY_ADDRESSES_BY_VERSION: BiconomyFactoriesByVersion = Object.fromEntries(
  Object.entries(BICONOMY_FACTORY_ADDRESSES).map(([k, v]) => [v, k]),
);

// TODO // Update with latest implementation address which includes 2D nonce interface
export const BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION: BiconomyImplementationsByVersion = Object.fromEntries(
  Object.entries(BICONOMY_IMPLEMENTATION_ADDRESSES).map(([k, v]) => [v, k]),
);

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101];
