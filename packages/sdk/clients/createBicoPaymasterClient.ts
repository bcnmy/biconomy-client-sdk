import { http, type OneOf, type Transport } from "viem"
import {
  type PaymasterClient,
  type PaymasterClientConfig,
  createPaymasterClient
} from "viem/account-abstraction"

type BicoPaymasterClientConfig = Omit<PaymasterClientConfig, "transport"> &
  OneOf<
    | {
        transport?: Transport
      }
    | {
        paymasterUrl: string
      }
    | {
        chainId: number
        apiKey: string
      }
  >

export const createBicoPaymasterClient = (
  parameters: BicoPaymasterClientConfig
): PaymasterClient =>
  createPaymasterClient({
    ...parameters,
    transport:
      parameters.transport ?? parameters.paymasterUrl
        ? http(parameters.paymasterUrl)
        : http(
            `https://paymaster.biconomy.io/api/v2/${parameters.chainId}/${parameters.apiKey}`
          )
  })
