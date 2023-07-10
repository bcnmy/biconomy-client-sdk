import { ChainId } from '@biconomy/core-types'

export const UserOpReceiptIntervals: { [key in ChainId]?: number } = {
  [ChainId.MAINNET]: 10000,
  [ChainId.GOERLI]: 5000,
  [ChainId.POLYGON_MUMBAI]: 5000,
  [ChainId.POLYGON_MAINNET]: 5000,
  [ChainId.BSC_TESTNET]: 5000,
  [ChainId.BSC_MAINNET]: 5000,
  [ChainId.POLYGON_ZKEVM_TESTNET]: 5000,
  [ChainId.POLYGON_ZKEVM_MAINNET]: 5000,
  [ChainId.ARBITRUM_GOERLI_TESTNET]: 5000,
  [ChainId.ARBITRUM_ONE_MAINNET]: 5000,
  [ChainId.ARBITRUM_NOVA_MAINNET]: 5000,
  [ChainId.OPTIMISM_MAINNET]: 5000,
  [ChainId.OPTIMISM_GOERLI_TESTNET]: 5000,
  [ChainId.AVALANCHE_MAINNET]: 5000,
  [ChainId.AVALANCHE_TESTNET]: 5000,
  [ChainId.MOONBEAM_MAINNET]: 5000,
  [ChainId.BASE_GOERLI_TESTNET]: 5000,
  [ChainId.LINEA_TESTNET]: 5000
}
