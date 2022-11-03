import { IPaymasterAPI } from "@biconomy-sdk/core-types"

export interface ClientConfig {
  dappAPIKey: string
  biconomySigningServiceUrl: string
  // paymasterAddress: string
  customPaymasterAPI?: IPaymasterAPI
  entryPointAddress: string
  bundlerUrl: string
  chainId: number
}
