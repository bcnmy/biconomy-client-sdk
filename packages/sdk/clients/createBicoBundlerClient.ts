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
        apiKey?: string
      }
  >

export const createBicoBundlerClient = (
  parameters: BicoBundlerClientConfig
): BundlerClient => {
  if (
    !parameters.apiKey &&
    !parameters.bundlerUrl &&
    !parameters.transport &&
    !parameters?.chain
  ) {
    throw new Error(
      "Cannot set determine a bundler url, please provide a chain."
    )
  }

  return createBundlerClient({
    ...parameters,
    transport:
      parameters.transport ? parameters.transport : parameters.bundlerUrl
        ? http(parameters.bundlerUrl)
        : http(
            // @ts-ignore: Type saftey provided by the if statement above
            `https://bundler.biconomy.io/api/v3/${parameters.chain.id}/${
              parameters.apiKey ??
              "nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14"
            }`
          )
  })
}
