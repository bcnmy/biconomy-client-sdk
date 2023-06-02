import { ChainId } from '@biconomy/core-types'

export const NODE_CLIENT_URL = 'https://sdk-backend.prod.biconomy.io/v1'

export const RPC_PROVIDER_URLS: { [key in ChainId]?: string } = {
    [ChainId.MAINNET]: 'https://ethereum.publicnode.com',
    [ChainId.GOERLI]: 'https://ethereum-goerli.publicnode.com',
    [ChainId.POLYGON_MUMBAI] : 'https://polygon-mumbai-bor.publicnode.com',
    [ChainId.POLYGON_MAINNET] : 'https://polygon-bor.publicnode.com',
    [ChainId.BSC_TESTNET] : 'https://endpoints.omniatech.io/v1/bsc/testnet/public',
    [ChainId.BSC_MAINNET] : 'https://bsc.meowrpc.com',
    [ChainId.POLYGON_ZKEVM_TESTNET] : 'https://rpc.ankr.com/arbitrum',
    [ChainId.POLYGON_ZKEVM_MAINNET] : 'https://rpc.ankr.com/arbitrum',
    [ChainId.ARBITRUM_GOERLI_TESTNET] : 'https://goerli-rollup.arbitrum.io/rpc',
    [ChainId.ARBITRUM_ONE_MAINNET] : 'https://rpc.ankr.com/arbitrum',
    [ChainId.ARBITRUM_NOVA_MAINNET] : 'https://nova.arbitrum.io/rpc'
};