import { ChainId, SmartAccountConfig, SignTypeMethod, NetworkTypes } from '@biconomy-sdk/core-types'


// Testnet config
export const TestnetSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.GOERLI, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  signType: SignTypeMethod.EIP712_SIGN,
  backendUrl: 'https://sdk-backend.staging.biconomy.io/v1',
  relayerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
  bundlerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  biconomySigningServiceUrl:
    'https://us-central1-biconomy-staging.cloudfunctions.net/signing-service',
  // TODO : has to be public provider urls (local config / backend node)
  networkConfig: [
    {
      chainId: ChainId.GOERLI,
      providerUrl: 'https://eth-goerli.alchemyapi.io/v2/lmW2og_aq-OXWKYRoRu-X6Yl6wDQYt_2'
    },
    {
      chainId: ChainId.POLYGON_MUMBAI,
      providerUrl: 'https://polygon-mumbai.g.alchemy.com/v2/Q4WqQVxhEEmBYREX22xfsS2-s5EXWD31'
    }
  ]
}

// Mainnet config
// TODO: need to update urls for mainnet
export const MainnetSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.MAINNET, //Update later
  supportedNetworksIds: [ChainId.MAINNET, ChainId.POLYGON_MAINNET],
  signType: SignTypeMethod.EIP712_SIGN,
  backendUrl: 'https://sdk-backend.production.biconomy.io/v1',
  relayerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
  bundlerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  biconomySigningServiceUrl:
    'https://us-central1-biconomy-staging.cloudfunctions.net/signing-service',
  // TODO : has to be public provider urls (local config / backend node)
  networkConfig: [
    {
      chainId: ChainId.MAINNET,
      providerUrl: 'https://mainnet.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
    },
    {
      chainId: ChainId.POLYGON_MAINNET,
      providerUrl: 'https://polygon-mainnet-public.unifra.io'
    }
  ]
}

/**
 * 
 * @param networkType could be TESTNET OR MAINNET
 * @description return config for specific network
 * @returns 
 */
export const getConfigByNetwork = (networkType: string) : SmartAccountConfig => {
    if ( !networkType || networkType === NetworkTypes.TESTNET){
        return TestnetSmartAccountConfig
    }
    return MainnetSmartAccountConfig

}