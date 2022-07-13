export interface SmartAccountConfig {
  owner: string // EOA address
  activeNetworkId: ChainId
  supportedNetworksIds: ChainId[]
}
// backend_url
// relayer_url
// provider?

export interface ContractInfo {
  defaultAddress: string
  version: string
  abi: any[]
  networkAddresses: Record<string, string>
  contractName: string
  released: boolean
}

export enum ChainNames {
  // Ethereum
  MAINNET,
  ROPSTEN,
  RINKEBY,
  GOERLI,
  KOVAN
}

export enum ChainId {
  // Ethereum
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOVAN = 42
}
export interface NetworkConfig {
  entryPoint: string // abstract account contract
  fallbackHandler: string
  title?: string
  name: string
  chainId: number
  ensAddress?: string
  testnet?: boolean

  blockExplorer?: BlockExplorerConfig

  providerUrl?: string
  indexerUrl?: string
  relayerUrl?: string
  // isDefaultChain identifies the default network. For example, a dapp may run on the Polygon
  // network and may configure the wallet to use it as its main/default chain.
  isDefaultChain?: boolean
}

export type BlockExplorerConfig = {
  name?: string
  rootUrl: string
  addressUrl?: string
  txnHashUrl?: string
}

export const networks: Record<ChainId, NetworkConfig> = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'mainnet',
    title: 'Ethereum',
    blockExplorer: {
      name: 'Etherscan',
      rootUrl: 'https://etherscan.io/'
    },
    providerUrl: 'https://mainnet.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.ROPSTEN]: {
    chainId: ChainId.ROPSTEN,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'ropsten',
    title: 'Ropsten',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Ropsten)',
      rootUrl: 'https://ropsten.etherscan.io/'
    },
    providerUrl: 'https://ropsten.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'rinkeby',
    title: 'Rinkeby',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Rinkeby)',
      rootUrl: 'https://rinkeby.etherscan.io/'
    },
    providerUrl: 'https://rinkeby.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'goerli',
    title: 'Goerli',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Goerli)',
      rootUrl: 'https://goerli.etherscan.io/'
    },
    providerUrl: 'https://goerli.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.KOVAN]: {
    chainId: ChainId.KOVAN,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'kovan',
    title: 'Kovan',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Kovan)',
      rootUrl: 'https://kovan.etherscan.io/'
    },
    providerUrl: 'https://kovan.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  }
}
