import * as chains from "viem/chains"
import type { Chain } from "viem/chains"

/**
 * Utility method for converting a chainId to a {@link Chain} object
 *
 * @param chainId
 * @returns a {@link Chain} object for the given chainId
 * @throws if the chainId is not found
 */
export const getChain = (chainId: number): Chain => {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain
    }
  }
  throw new Error("Chain not found")
}
