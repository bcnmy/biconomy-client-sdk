import { PaymasterAPI } from './PaymasterAPI'

export interface ClientConfig {
  socketServerUrl: string // added by Biconomy
  paymasterAPI?: PaymasterAPI
  entryPointAddress: string
  bundlerUrl: string
  chainId: number
  txServiceUrl: string
  strictSponsorshipMode?: boolean // review
  // not using accountAddress in client config
}
