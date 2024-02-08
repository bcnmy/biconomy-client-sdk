import { ChainId } from "@biconomy/core-types";

export const NODE_CLIENT_URL = "https://sdk-backend.prod.biconomy.io/v1";

// eslint-disable-next-line no-unused-vars
export const RPC_PROVIDER_URLS: { [key in ChainId]?: string } = {
  [ChainId.MAINNET]: "https://rpc.ankr.com/eth",
  [ChainId.GOERLI]: "https://rpc.ankr.com/eth_goerli",
  [ChainId.SEPOLIA]: "https://rpc.ankr.com/eth_sepolia",
  [ChainId.POLYGON_MUMBAI]: "https://rpc.ankr.com/polygon_mumbai",
  [ChainId.POLYGON_MAINNET]: "https://rpc.ankr.com/polygon",
  [ChainId.BSC_TESTNET]: "https://endpoints.omniatech.io/v1/bsc/testnet/public",
  [ChainId.BSC_MAINNET]: "https://rpc.ankr.com/bsc",
  [ChainId.POLYGON_ZKEVM_TESTNET]: "https://rpc.public.zkevm-test.net",
  [ChainId.POLYGON_ZKEVM_MAINNET]: "https://rpc.ankr.com/polygon_zkevm",
  [ChainId.ARBITRUM_GOERLI_TESTNET]: "https://goerli-rollup.arbitrum.io/rpc",
  [ChainId.ARBITRUM_SEPOLIA]: "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
  [ChainId.ARBITRUM_ONE_MAINNET]: "https://rpc.ankr.com/arbitrum",
  [ChainId.ARBITRUM_NOVA_MAINNET]: "https://nova.arbitrum.io/rpc",
  [ChainId.OPTIMISM_MAINNET]: "https://mainnet.optimism.io",
  [ChainId.OPTIMISM_GOERLI_TESTNET]: "https://goerli.optimism.io",
  [ChainId.AVALANCHE_MAINNET]: "https://api.avax.network/ext/bc/C/rpc",
  [ChainId.AVALANCHE_TESTNET]: "https://api.avax-test.network/ext/bc/C/rpc",
  [ChainId.MOONBEAM_MAINNET]: "https://rpc.api.moonbeam.network",
  [ChainId.BASE_GOERLI_TESTNET]: "https://goerli.base.org",
  [ChainId.BASE_MAINNET]: "https://developer-access-mainnet.base.org",
  [ChainId.LINEA_TESTNET]: "https://rpc.goerli.linea.build",
  [ChainId.LINEA_MAINNET]: "https://rpc.linea.build",
  [ChainId.MANTLE_MAINNET]: "https://rpc.mantle.xyz",
  [ChainId.MANTLE_TESTNET]: "https://rpc.testnet.mantle.xyz",
  [ChainId.OPBNB_MAINNET]: "https://opbnb-mainnet-rpc.bnbchain.org",
  [ChainId.OPBNB_TESTNET]: "https://opbnb-testnet-rpc.bnbchain.org",
  [ChainId.ASTAR_MAINNET]: "https://evm.astar.network",
  [ChainId.ASTAR_TESTNET]: "https://evm.shibuya.astar.network",
  [ChainId.CHILIZ_MAINNET]: "https://rpc.ankr.com/chiliz",
  [ChainId.CHILIZ_TESTNET]: "https://spicy-rpc.chiliz.com",
  [ChainId.CORE_MAINNET]: "https://rpc.core.chain.com",
  [ChainId.CORE_TESTNET]: "https://rpc.testnet.core.chain.com",
  [ChainId.MANTA_PACIFIC_MAINNET]: "https://pacific-rpc.manta.network/http",
  [ChainId.MANTA_PACIFIC_TESTNET]: "https://pacific-rpc.testnet.manta.network/http",
  [ChainId.CAPX_TESTNET]: "https://capx-zk-rpc.lgns.me/sequencer-api",
  [ChainId.BLAST_SEPOLIA]: "https://sepolia.blast.io"
};
