import { ChainId, SmartAccountVersion } from '@biconomy-devx/core-types'
export type SmartAccountInfoResponse = {
  readonly name: string
  readonly version: string
  readonly api_version: string
  readonly secure: boolean
  readonly settings: {
    readonly AWS_CONFIGURED: boolean
    readonly AWS_S3_CUSTOM_DOMAIN: string
    readonly ETHEREUM_NODE_URL: string
    readonly ETHEREUM_TRACING_NODE_URL: string
    readonly ETH_INTERNAL_TXS_BLOCK_PROCESS_LIMIT: number
    readonly ETH_INTERNAL_NO_FILTER: boolean
    readonly ETH_REORG_BLOCKS: number
    readonly TOKENS_LOGO_BASE_URI: string
    readonly TOKENS_LOGO_EXTENSION: string
  }
}

// Review
export type SCWTransactionResponse = {
  symbol: string
  tokenAddress: string
  scwAddress: string
  txHash: string
  blockNumber: number
  payment: number
  gasLimit: number
  gasUsage: number
  gasPrice: number
  chainId: number
  fromAddress: string
  toAddress: string
  amount: number
  type: string
  txStatus: string
  createdAt: number
  updatedAt: number
}

export type BalancesDto = {
  chainId: number
  eoaAddress: string
  tokenAddresses: string[]
}

export type WhiteListSignatureResponse = {
  code: number
  message: string
  data: string
}

export type SmartAccountByOwnerDto = {
  chainId: number
  owner: string
  index: number
}

export type TokenByChainIdAndAddressDto = {
  chainId: number
  tokenAddress: string
}

export type ContractDetails = {
  version: SmartAccountVersion

  address: string

  abi: string
}

export type ChainConfig = {
  chainId: ChainId
  name: string
  symbol: string
  isL2: boolean
  isMainnet: boolean
  description: string
  blockExplorerUriTemplate: BlockExplorerConfig
  ensRegistryAddress: string
  walletFactory: ContractDetails[]
  multiSend: ContractDetails[]
  multiSendCall: ContractDetails[]
  wallet: ContractDetails[] // base wallet
  entryPoint: ContractDetails[] //should make this address var
  fallBackHandler: ContractDetails[] //should make this address var
  fallBackGasTankAddress: string
  relayerURL: string
  providerUrl: string
  indexerUrl: string
  backendNodeUrl: string
  createdAt: Date
  updatedAt: Date
  token: TokenInfo
}

export type MasterCopyResponse = {
  address: string
  version: string
  deployer: string
  deployedBlockNumber: number
  lastIndexedBlockNumber: number
}

export type SafeInfoResponse = {
  readonly address: string
  readonly nonce: number
  readonly threshold: number
  readonly owners: string[]
  readonly masterCopy: string
  readonly modules: string[]
  readonly fallbackHandler: string
  readonly version: string
}

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

// Review
// Info received from sdk backend
// As it seems currently it seems thought only for ECDSA validation module
// We should only need to obtain necessary info from backend
// Adding new modules will require changes here and sdk updates

export type ISmartAccount = {
  version: SmartAccountVersion
  smartAccountAddress: string
  isDeployed: boolean
  chainId: ChainId
  eoaAddress: string
  entryPointAddress: string
  handlerAddress: string
  index: number
  implementationAddress: string
  fallBackHandlerAddress: string
  owner: string
  factoryAddress: string
  createdAt: number
  updatedAt: number
}

export type IBalances = {
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: string
  contract_address: string
  supports_erc: string | null
  logo_url: string | null
  last_transferred_at: string | null
  type: string
  balance: number
  balance_24h: number
  quote_rate: number
  quote_rate_24h: number
  nft_data: string | null
}

export type SupportedChainsResponse = {
  message: string
  code: number
  data: ChainConfig[]
}

export type IndividualChainResponse = {
  message: string
  code: number
  data: ChainConfig
}

export type TokenPriceResponse = {
  price: number
}

export type SupportedTokensResponse = {
  message: string
  code: number
  data: TokenInfo[]
}

export type IndividualTokenResponse = {
  message: string
  code: number
  data: TokenInfo
}
export type SmartAccountsResponse = {
  message: string
  code: number
  data: ISmartAccount[]
}
export type BalancesResponse = {
  message: string
  code: number
  data: IBalances[]
}

export type UsdBalanceResponse = {
  message: string
  code: number
  data: {
    totalBalance: number
  }
}

export type EstimateGasResponse = {
  message: string
  code: number
  data: {
    gas: number
    txBaseGas?: number
  }
}
