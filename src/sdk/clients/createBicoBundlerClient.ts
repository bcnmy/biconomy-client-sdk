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

/**
 * Creates a Bico Bundler Client with a given Transport configured for a Chain.
 *
 * @param parameters - Configuration for the Bico Bundler Client
 * @returns A Bico Bundler Client
 *
 * @example
 * import { createBicoBundlerClient, http } from '@biconomy/sdk'
 * import { mainnet } from 'viem/chains'
 *
 * const bundlerClient = createBicoBundlerClient({ chain: mainnet });
 */
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
    transport: parameters.transport
      ? parameters.transport
      : parameters.bundlerUrl
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
