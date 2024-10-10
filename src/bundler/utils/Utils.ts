/**
 * Extracts the chain ID from a given URL.
 * 
 * @param url - The URL to extract the chain ID from.
 * @returns The extracted chain ID as a number.
 * @throws {Error} If the chain ID is not found in the URL or is invalid.
 * 
 * @example
 * // Returns 80001
 * extractChainIdFromUrl("https://example.com/api/v2/80001/rpc")
 */
export const extractChainIdFromUrl = (url: string): number => {
  try {
    const regex = /\/(\d+)\//;
    const match = regex.exec(new URL(url).pathname);
    if (!match) {
      throw new Error("Chain ID not found in URL");
    }
    const chainId = Number.parseInt(match[1], 10);
    if (Number.isNaN(chainId)) {
      throw new Error("Invalid chain ID");
    }
    return chainId;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid chain id: ${error.message}`);
    }
    throw new Error("Invalid chain id");
  }
};

/**
 * Extracts the chain ID from a bundler URL.
 * 
 * @param url - The bundler URL to extract the chain ID from.
 * @returns The extracted chain ID as a number.
 * @throws {Error} If the chain ID is not found in the URL or is invalid.
 */
export const extractChainIdFromBundlerUrl = (url: string): number =>
  extractChainIdFromUrl(url);

/**
 * Extracts the chain ID from a paymaster URL.
 * 
 * @param url - The paymaster URL to extract the chain ID from.
 * @returns The extracted chain ID as a number.
 * @throws {Error} If the chain ID is not found in the URL or is invalid.
 */
export const extractChainIdFromPaymasterUrl = (url: string): number =>
  extractChainIdFromUrl(url);