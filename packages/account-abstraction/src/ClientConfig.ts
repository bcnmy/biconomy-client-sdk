import { IPaymasterAPI } from '@biconomy/core-types'

export interface ClientConfig {
  dappAPIKey: string
  socketServerUrl: string
  biconomySigningServiceUrl: string
  customPaymasterAPI?: IPaymasterAPI
  entryPointAddress: string
  bundlerUrl: string
  chainId: number
}
