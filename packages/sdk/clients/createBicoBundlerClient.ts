import { http, type OneOf, type Transport } from "viem"
import {
  type BundlerClient,
  type BundlerClientConfig,
  createBundlerClient
} from "viem/account-abstraction"

type BicoBundlerClientConfig = Omit<BundlerClientConfig, "transport"> &
  OneOf<
    | {
        transport?: Transport
      }
    | {
        bundlerUrl: string
      }
    | {
        chainId: number
        apiKey?: string
      }
  >

export const createBicoBundlerClient = (
  parameters: BicoBundlerClientConfig
): BundlerClient =>
  createBundlerClient({
    ...parameters,
    transport:
      parameters.transport ?? parameters.bundlerUrl
        ? http(parameters.bundlerUrl)
        : http(
            `https://bundler.biconomy.io/api/v2/${parameters.chainId}/${
              parameters.apiKey ??
              "nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14"
            }`
          )
  })
