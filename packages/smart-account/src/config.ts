import { ChainId, SmartAccountConfig, SignTypeMethod } from '@biconomy/core-types'

export const ProductionConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.POLYGON_MAINNET,
  supportedNetworksIds: [
    ChainId.MAINNET,
    ChainId.GOERLI,
    ChainId.POLYGON_MUMBAI,
    ChainId.POLYGON_MAINNET,
    ChainId.BSC_TESTNET,
    ChainId.BSC_MAINNET,
    ChainId.ARBITRUM_GOERLI_TESTNET,
    ChainId.ARBITRUM_ONE_MAINNET,
    ChainId.ARBITRUM_NOVA_MAINNET,
    ChainId.POLYGON_ZKEVM_TESTNET,
    ChainId.POLYGON_ZKEVM_MAINNET
  ],
  signType: SignTypeMethod.EIP712_SIGN,
  backendUrl: 'https://sdk-backend.prod.biconomy.io/v1',
  relayerUrl: 'https://sdk-relayer.prod.biconomy.io/api/v1/relay',
  socketServerUrl: 'wss://sdk-ws.prod.biconomy.io/connection/websocket',
  bundlerUrl: 'https://sdk-relayer.prod.biconomy.io/api/v1/relay',
  paymasterUrl: 'https://paymaster-signing-service.prod.biconomy.io/api/v1/sign',
  strictSponsorshipMode: false,
  networkConfig: [
    {
      chainId: ChainId.MAINNET,
      providerUrl: 'https://eth-mainnet.g.alchemy.com/v2/oIGKtCZoQ2AQUt0sfD46oXB6mv47u9yy'
    },
    {
      chainId: ChainId.GOERLI,
      providerUrl: 'https://eth-goerli.alchemyapi.io/v2/lmW2og_aq-OXWKYRoRu-X6Yl6wDQYt_2'
    },
    {
      chainId: ChainId.POLYGON_MUMBAI,
      providerUrl:
        'https://rpc.ankr.com/polygon_mumbai/a3470f3dd286827d86d813270dcc953e41145ca859df7f931347139cc9ad084c'
    },
    {
      chainId: ChainId.POLYGON_MAINNET,
      providerUrl: 'https://polygon-mainnet.g.alchemy.com/v2/6Tn--QDkp1vRBXzRV3Cc8fLXayr5Yoij'
    },
    {
      chainId: ChainId.BSC_TESTNET,
      providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
    },
    {
      chainId: ChainId.BSC_MAINNET,
      providerUrl: 'https://bsc-dataseed1.binance.org'
    },
    {
      chainId: ChainId.ARBITRUM_GOERLI_TESTNET,
      providerUrl: 'https://goerli-rollup.arbitrum.io/rpc'
    },
    {
      chainId: ChainId.ARBITRUM_ONE_MAINNET,
      providerUrl: 'https://rpc.ankr.com/arbitrum'
    },
    {
      chainId: ChainId.ARBITRUM_NOVA_MAINNET,
      providerUrl: 'https://nova.arbitrum.io/rpc'
    },
    {
      chainId: ChainId.POLYGON_ZKEVM_TESTNET,
      providerUrl: 'https://rpc.ankr.com/arbitrum'
    },
    {
      chainId: ChainId.POLYGON_ZKEVM_MAINNET,
      providerUrl: 'https://rpc.ankr.com/arbitrum'
    }
  ]
}

export const StagingConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.POLYGON_MUMBAI,
  supportedNetworksIds: [
    ChainId.GOERLI,
    ChainId.POLYGON_MUMBAI,
    ChainId.BSC_TESTNET,
    ChainId.POLYGON_ZKEVM_TESTNET,
    ChainId.ARBITRUM_GOERLI_TESTNET
  ],
  signType: SignTypeMethod.EIP712_SIGN,
  backendUrl: 'https://sdk-backend.staging.biconomy.io/v1',
  relayerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
  bundlerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  paymasterUrl: 'https://paymaster-signing-service.staging.biconomy.io/api/v1/sign',
  strictSponsorshipMode: false,
  networkConfig: [
    {
      chainId: ChainId.GOERLI,
      providerUrl: 'https://eth-goerli.alchemyapi.io/v2/lmW2og_aq-OXWKYRoRu-X6Yl6wDQYt_2'
    },
    {
      chainId: ChainId.POLYGON_MUMBAI,
      providerUrl:
        'https://rpc.ankr.com/polygon_mumbai/a3470f3dd286827d86d813270dcc953e41145ca859df7f931347139cc9ad084c'
    },
    {
      chainId: ChainId.BSC_TESTNET,
      providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
    },
    {
      chainId: ChainId.POLYGON_MAINNET,
      providerUrl: 'https://polygon-mainnet.g.alchemy.com/v2/6Tn--QDkp1vRBXzRV3Cc8fLXayr5Yoij'
    },
    {
      chainId: ChainId.POLYGON_ZKEVM_TESTNET,
      providerUrl: 'https://rpc.public.zkevm-test.net'
    },
    {
      chainId: ChainId.ARBITRUM_GOERLI_TESTNET,
      providerUrl: 'https://goerli-rollup.arbitrum.io/rpc'
    }
  ]
}

export const DevelopmentConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.POLYGON_MUMBAI,
  supportedNetworksIds: [
    ChainId.GOERLI,
    ChainId.POLYGON_MUMBAI,
    ChainId.BSC_TESTNET,
    ChainId.POLYGON_ZKEVM_TESTNET,
    ChainId.ARBITRUM_GOERLI_TESTNET
  ],
  signType: SignTypeMethod.EIP712_SIGN,
  backendUrl: 'https://sdk-backend.test.biconomy.io/v1',
  relayerUrl: 'https://sdk-relayer.test.biconomy.io/api/v1/relay',
  socketServerUrl: 'wss://sdk-testing-ws.test.biconomy.io/connection/websocket',
  bundlerUrl: 'https://sdk-relayer.test.biconomy.io/api/v1/relay',
  paymasterUrl: 'https://paymaster-signing-service.test.biconomy.io/api/v1/sign',
  strictSponsorshipMode: false,
  networkConfig: [
    {
      chainId: ChainId.GOERLI,
      providerUrl: 'https://eth-goerli.alchemyapi.io/v2/lmW2og_aq-OXWKYRoRu-X6Yl6wDQYt_2'
    },
    {
      chainId: ChainId.POLYGON_MUMBAI,
      providerUrl:
        'https://rpc.ankr.com/polygon_mumbai/a3470f3dd286827d86d813270dcc953e41145ca859df7f931347139cc9ad084c'
    },
    {
      chainId: ChainId.BSC_TESTNET,
      providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
    },
    {
      chainId: ChainId.POLYGON_ZKEVM_TESTNET,
      providerUrl: 'https://rpc.public.zkevm-test.net'
    },
    {
      chainId: ChainId.ARBITRUM_GOERLI_TESTNET,
      providerUrl: 'https://goerli-rollup.arbitrum.io/rpc'
    }
  ]
}
