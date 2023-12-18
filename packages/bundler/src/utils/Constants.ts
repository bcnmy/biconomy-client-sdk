import { ChainId } from "@biconomy/core-types";

// eslint-disable-next-line no-unused-vars
export const UserOpReceiptIntervals: { [key in ChainId]?: number } = {
  [ChainId.MAINNET]: 10000,
  [ChainId.GOERLI]: 2000,
  [ChainId.POLYGON_MUMBAI]: 2000,
  [ChainId.POLYGON_MAINNET]: 2000,
  [ChainId.BSC_TESTNET]: 2000,
  [ChainId.BSC_MAINNET]: 2000,
  [ChainId.POLYGON_ZKEVM_TESTNET]: 2000,
  [ChainId.POLYGON_ZKEVM_MAINNET]: 2000,
  [ChainId.ARBITRUM_GOERLI_TESTNET]: 2000,
  [ChainId.ARBITRUM_ONE_MAINNET]: 2000,
  [ChainId.ARBITRUM_NOVA_MAINNET]: 2000,
  [ChainId.OPTIMISM_MAINNET]: 2000,
  [ChainId.OPTIMISM_GOERLI_TESTNET]: 2000,
  [ChainId.AVALANCHE_MAINNET]: 2000,
  [ChainId.AVALANCHE_TESTNET]: 2000,
  [ChainId.MOONBEAM_MAINNET]: 2000,
  [ChainId.BASE_GOERLI_TESTNET]: 2000,
  [ChainId.BASE_MAINNET]: 2000,
  [ChainId.LINEA_TESTNET]: 2000,
  [ChainId.LINEA_MAINNET]: 2000,
  [ChainId.MANTLE_MAINNET]: 2000,
  [ChainId.MANTLE_TESTNET]: 2000,
  [ChainId.OPBNB_MAINNET]: 2000,
  [ChainId.OPBNB_TESTNET]: 2000,
  [ChainId.ASTAR_MAINNET]: 2000,
  [ChainId.ASTAR_TESTNET]: 2000,
  [ChainId.CHILIZ_MAINNET]: 2000,
  [ChainId.CHILIZ_TESTNET]: 2000,
};

// Note: Reduced by 1/10th.. can reduce more
export const UserOpWaitForTxHashIntervals: { [key in ChainId]?: number } = {
  [ChainId.MAINNET]: 1000,
  [ChainId.GOERLI]: 500,
  [ChainId.POLYGON_MUMBAI]: 500,
  [ChainId.POLYGON_MAINNET]: 500,
  [ChainId.BSC_TESTNET]: 500,
  [ChainId.BSC_MAINNET]: 500,
  [ChainId.POLYGON_ZKEVM_TESTNET]: 500,
  [ChainId.POLYGON_ZKEVM_MAINNET]: 500,
  [ChainId.ARBITRUM_GOERLI_TESTNET]: 500,
  [ChainId.ARBITRUM_ONE_MAINNET]: 500,
  [ChainId.ARBITRUM_NOVA_MAINNET]: 500,
  [ChainId.OPTIMISM_MAINNET]: 500,
  [ChainId.OPTIMISM_GOERLI_TESTNET]: 500,
  [ChainId.AVALANCHE_MAINNET]: 500,
  [ChainId.AVALANCHE_TESTNET]: 500,
  [ChainId.MOONBEAM_MAINNET]: 500,
  [ChainId.BASE_GOERLI_TESTNET]: 500,
  [ChainId.BASE_MAINNET]: 500,
  [ChainId.LINEA_TESTNET]: 500,
  [ChainId.LINEA_MAINNET]: 500,
  [ChainId.MANTLE_MAINNET]: 500,
  [ChainId.MANTLE_TESTNET]: 500,
  [ChainId.OPBNB_MAINNET]: 500,
  [ChainId.OPBNB_TESTNET]: 500,
  [ChainId.ASTAR_MAINNET]: 500,
  [ChainId.ASTAR_TESTNET]: 500,
  [ChainId.CHILIZ_MAINNET]: 500,
  [ChainId.CHILIZ_TESTNET]: 500,
};

export const UserOpReceiptMaxDurationIntervals: { [key in ChainId]?: number } = {
  [ChainId.MAINNET]: 300000,
  [ChainId.GOERLI]: 50000,
  [ChainId.POLYGON_MUMBAI]: 50000,
  [ChainId.POLYGON_MAINNET]: 60000,
  [ChainId.BSC_TESTNET]: 50000,
  [ChainId.BSC_MAINNET]: 50000,
  [ChainId.POLYGON_ZKEVM_TESTNET]: 40000,
  [ChainId.POLYGON_ZKEVM_MAINNET]: 40000,
  [ChainId.ARBITRUM_GOERLI_TESTNET]: 50000,
  [ChainId.ARBITRUM_ONE_MAINNET]: 50000,
  [ChainId.ARBITRUM_NOVA_MAINNET]: 30000,
  [ChainId.OPTIMISM_MAINNET]: 40000,
  [ChainId.OPTIMISM_GOERLI_TESTNET]: 40000,
  [ChainId.AVALANCHE_MAINNET]: 40000,
  [ChainId.AVALANCHE_TESTNET]: 40000,
  [ChainId.MOONBEAM_MAINNET]: 40000,
  [ChainId.BASE_GOERLI_TESTNET]: 40000,
  [ChainId.BASE_MAINNET]: 40000,
  [ChainId.LINEA_TESTNET]: 50000,
  [ChainId.LINEA_MAINNET]: 50000,
  [ChainId.MANTLE_MAINNET]: 40000,
  [ChainId.MANTLE_TESTNET]: 40000,
  [ChainId.OPBNB_MAINNET]: 40000,
  [ChainId.OPBNB_TESTNET]: 40000,
  [ChainId.ASTAR_MAINNET]: 40000,
  [ChainId.ASTAR_TESTNET]: 40000,
  [ChainId.CHILIZ_MAINNET]: 40000,
  [ChainId.CHILIZ_TESTNET]: 40000,
};

export const UserOpWaitForTxHashMaxDurationIntervals: { [key in ChainId]?: number } = {
  [ChainId.MAINNET]: 20000,
  [ChainId.GOERLI]: 20000,
  [ChainId.POLYGON_MUMBAI]: 20000,
  [ChainId.POLYGON_MAINNET]: 20000,
  [ChainId.BSC_TESTNET]: 20000,
  [ChainId.BSC_MAINNET]: 20000,
  [ChainId.POLYGON_ZKEVM_TESTNET]: 20000,
  [ChainId.POLYGON_ZKEVM_MAINNET]: 20000,
  [ChainId.ARBITRUM_GOERLI_TESTNET]: 20000,
  [ChainId.ARBITRUM_ONE_MAINNET]: 20000,
  [ChainId.ARBITRUM_NOVA_MAINNET]: 20000,
  [ChainId.OPTIMISM_MAINNET]: 20000,
  [ChainId.OPTIMISM_GOERLI_TESTNET]: 20000,
  [ChainId.AVALANCHE_MAINNET]: 20000,
  [ChainId.AVALANCHE_TESTNET]: 20000,
  [ChainId.MOONBEAM_MAINNET]: 20000,
  [ChainId.BASE_GOERLI_TESTNET]: 20000,
  [ChainId.BASE_MAINNET]: 20000,
  [ChainId.LINEA_TESTNET]: 20000,
  [ChainId.LINEA_MAINNET]: 20000,
  [ChainId.MANTLE_MAINNET]: 20000,
  [ChainId.MANTLE_TESTNET]: 20000,
  [ChainId.OPBNB_MAINNET]: 20000,
  [ChainId.OPBNB_TESTNET]: 20000,
  [ChainId.ASTAR_MAINNET]: 20000,
  [ChainId.ASTAR_TESTNET]: 20000,
  [ChainId.CHILIZ_MAINNET]: 20000,
  [ChainId.CHILIZ_TESTNET]: 20000,
};
