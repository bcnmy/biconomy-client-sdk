// { CHAIN_CONFIG } hold constants for each of supported blockchain network
export const CHAIN_CONFIG = {
  eth_mainnet: {
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    providerUrl: 'https://mainnet.infura.net/936b8efb8f6e3109a',
    relayerUrl: 'https://relayer.biconomy.io',
    nodeUrl: 'https://node.biconomy.io',
    chainid: '0x01'
  },
  polygon_mainnet: {
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    providerUrl: 'https://polygon.infura.net/936b8efb8f6e3109a',
    relayerUrl: 'https://relayer.biconomy.io',
    nodeUrl: 'https://node.biconomy.io',
    chainid: '137'
  }
}
