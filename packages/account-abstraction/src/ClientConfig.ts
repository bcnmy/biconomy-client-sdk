import { IPaymasterAPI } from '@biconomy-devx/core-types'

export interface ClientConfig {
  dappAPIKey: string // added by Biconomy
  socketServerUrl: string // added by Biconomy
  biconomySigningServiceUrl: string // added by Biconomy
  customPaymasterAPI?: IPaymasterAPI
  entryPointAddress: string
  bundlerUrl: string
  chainId: number
  txServiceUrl: string
  strictSponsorshipMode?: boolean // review
  // not using accountAddress in client config
}
