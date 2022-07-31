import { BytesLike, Wallet, BigNumberish } from 'ethers';
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import { MultiSendContract, SmartWalletFactoryContract, SmartWalletContract, MultiSendCallOnlyContract } from '@biconomy-sdk/core-types';

// walletProvider: WalletProviderLike
// TODO : Ability to provide custom URLs for all supported networks
export interface SmartAccountConfig {
  activeNetworkId: ChainId
  supportedNetworksIds: ChainId[]
  backend_url: string
}
// relayer_url

// TODO
// Review location, usage and name of types @chirag
// Should be kept in native types and the moment it needs to be shared by other package, move to core types and use from there
export interface Transaction {
  to: string
  value?: BigNumberish
  data?: string
  nonce?: BigNumberish
  gasLimit?: BigNumberish
  // delegateCall?: boolean
  // revertOnError?: boolean
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface SmartAccountState {
  address: string,
  owner: string,
  isDeployed: boolean,
  entryPointAddress: string,
  fallbackHandlerAddress: string,
}

export interface SmartAccountContext {
  baseWallet: SmartWalletContract,
  walletFactory: SmartWalletFactoryContract,
  multiSend: MultiSendContract,
  multiSendCall: MultiSendCallOnlyContract
}

// reference i could work on
export interface WalletProvider {
  readonly type?: string;
  readonly wallet?: Wallet;
  readonly address: string;
  readonly networkName?: NetworkNames;
  signMessage(message: BytesLike): Promise<string>;
}

export interface WalletLike {
  privateKey: string;
}

export type WalletProviderLike = string | WalletLike | WalletProvider;

export enum NetworkNames {
  Mainnet = 'mainnet',
  Ropsten = 'ropsten',
  Rinkeby = 'rinkeby',
  Goerli = 'goerli',
  Kovan = 'kovan',
  Xdai = 'xdai',
  Bsc = 'bsc',
  BscTest = 'bscTest',
  Fantom = 'fantom',
  FantomTest = 'fantomTest',
  Matic = 'matic',
  Mumbai = 'mumbai',
  Aurora = 'aurora',
  AuroraTest = 'auroraTest',
  Avalanche = 'avalanche',
  Fuji = 'fuji',
  Optimism = 'optimism',
  OptimismKovan = 'optimismKovan',
  Arbitrum = 'arbitrum',
  ArbitrumTest = 'arbitrumTest',
  Moonbeam = 'moonbeam',
  Moonbase = 'moonbase',
  Celo = 'celo',
  CeloTest = 'celoTest',
}

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
  KOVAN = 42,
  MUMBAI = 80001,
  GANACHE = 1337 //Temp
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

/*export type BlockExplorerConfig = {
  name?: string
  rootUrl: string
  addressUrl?: string
  txnHashUrl?: string
}*/

export type BlockExplorerConfig = {
  address: string
  txHash: string
  api: string
}

export type TokenInfo = {
  id: number
  name: string
  symbol: string
  blockChain: number
  ercType?: string
  decimals: number
  logoUri: string
  address: string
  isNativeToken: boolean
  isEnabled: boolean
  cmcId: number //Verify
  price: number //Verify
  createdAt: Date
  updatedAt: Date
}

export type ChainConfigResponse = {
  message: string
  code: number
  data: ChainConfig[]
}

export type ChainConfig = {
  chainId: number
  name: string
  symbol: string
  isL2: boolean
  isMainnet: boolean
  description: string
  blockExplorerUriTemplate: BlockExplorerConfig
  ensRegistryAddress: string
  walletFactoryAddress: string
  multiSendAddress: string
  multiSendCallAddress: string
  walletAddress: string // base wallet
  entryPoint: string //should make this address var
  fallBackHandler: string //should make this address var
  relayerURL: string
  providerUrl: string
  indexerUrl: string
  backendNodeUrl: string
  createdAt: Date
  updatedAt: Date
  token: TokenInfo
}

export const networks: Record<ChainId, NetworkConfig> = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'mainnet',
    title: 'Ethereum',
    blockExplorer: {
      // name: 'Etherscan',
      address: 'https://etherscan.io/address',
      txHash: 'https://etherscan.io/tx',
      api: 'https://api.etherscan.io/'
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
      //name: 'Etherscan (Ropsten)',
      address: 'https://ropsten.etherscan.io/address',
      txHash: 'https://ropsten.etherscan.io/tx',
      api: 'https://api.ropsten.etherscan.io/'
    },
    providerUrl: 'https://ropsten.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    entryPoint: '0x1D67cb5Db425bD6Bdf7472c44E6415c6B450Ae0B',
    fallbackHandler: '0xa9939Cb3Ed4efaeA050f75A23fD8709cBE6181e4',
    name: 'rinkeby',
    title: 'Rinkeby',
    testnet: true,
    blockExplorer: {
      //name: 'Etherscan (Rinkeby)',
      address: 'https://rinkeby.etherscan.io/address',
      txHash: 'https://rinkeby.etherscan.io/tx',
      api: 'https://api.rinkeby.etherscan.io/'
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
      //name: 'Etherscan (Goerli)',
      address: 'https://goerli.etherscan.io/address',
      txHash: 'https://goerli.etherscan.io/tx',
      api: 'https://api.goerli.etherscan.io/'
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
      //name: 'Etherscan (Kovan)',
      address: 'https://kovan.etherscan.io/address',
      txHash: 'https://kovan.etherscan.io/tx',
      api: 'https://api.kovan.etherscan.io/',
    },
    providerUrl: 'https://kovan.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.MUMBAI]: {
    chainId: ChainId.MUMBAI,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'ropsten',
    title: 'Ropsten',
    testnet: true,
    blockExplorer: {
      //name: 'Etherscan (Ropsten)',
      address: 'https://ropsten.etherscan.io/address',
      txHash: 'https://ropsten.etherscan.io/tx',
      api: 'https://api.ropsten.etherscan.io/'
    },
    providerUrl: 'https://ropsten.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
  [ChainId.GANACHE]: {
    chainId: ChainId.GANACHE,
    entryPoint: '0xfb8131c260749c7835a08ccbdb64728de432858e',
    fallbackHandler: '0x006b640910f739fec38b936b8efb8f6e3109aaca',
    name: 'ropsten',
    title: 'Ropsten',
    testnet: true,
    blockExplorer: {
      //name: 'Etherscan (Ropsten)',
      address: 'https://ropsten.etherscan.io/address',
      txHash: 'https://ropsten.etherscan.io/tx',
      api: 'https://api.ropsten.etherscan.io/'
    },
    providerUrl: 'https://ropsten.infura.io/v3/c6ed0fff2278441896180f00a2f9ad55'
  },
}
