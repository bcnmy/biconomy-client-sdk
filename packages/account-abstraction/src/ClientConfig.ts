import { IPaymasterAPI } from '@biconomy/core-types'

export interface ClientConfig {
  socketServerUrl: string // added by Biconomy
  paymasterUrl: string // added by Biconomy
  customPaymasterAPI?: IPaymasterAPI
  entryPointAddress: string
  bundlerUrl: string
  chainId: number
  txServiceUrl: string
  strictSponsorshipMode?: boolean // review
  // not using accountAddress in client config
}
