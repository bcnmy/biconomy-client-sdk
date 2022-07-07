// { SmartAccountConfig } represent properties that dapps can pass for wallet instantiation
export interface SmartAccountConfig {
  owner: string // EOA address
  entryPoint?: string //
  fallbackHandler?: string
  index: number
  chain_name: string
  providerUrl?: string
  relayerUrl?: string
  nodeUrl?: string
}
// { ContractInfo } hold details related to contract
export interface ContractInfo {
  defaultAddress: string
  version: string
  abi: any[]
  networkAddresses: Record<string, string>
  contractName: string
  released: boolean
}
