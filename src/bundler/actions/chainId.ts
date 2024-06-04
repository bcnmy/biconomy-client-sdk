import type { Account, Chain, Client, Transport } from "viem"
import type { BundlerClient } from "../createBundlerClient.js"

/**
 * Returns the supported chain id by the bundler service
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @returns Supported chain id
 *
 * @example
 * import { createClient } from "viem"
 *
 * const bundlerClient = createClient({
 *      chain: polygonMumbai,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const bundlerChainId = chainId(bundlerClient)
 * // Return 80001 for Mumbai
 */
export const chainId = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount>
) => Number(await client.request({ method: "eth_chainId" }))
