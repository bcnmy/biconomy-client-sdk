import * as chains from "viem/chains";
import type { Chain } from "viem/chains";

const CUSTOM_CHAINS: Chain[] = [
  {
    id: 81_457,
    name: "Blast",
    nativeCurrency: {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
    },
    rpcUrls: {
      public: { http: ["https://rpc.blast.io"] },
      default: { http: ["https://rpc.blast.io"] },
    },
    blockExplorers: {
      etherscan: { name: "Blastscan", url: "https://blastscan.io/" },
      default: { name: "Blastscan", url: "https://blastscan.io/" },
    },
    contracts: {
      multicall3: {
        address: "0xca11bde05977b3631167028862be2a173976ca11",
        blockCreated: 88_189,
      },
    },
  },
];

/**
 * Utility method for converting a chainId to a {@link Chain} object
 *
 * @param chainId
 * @returns a {@link Chain} object for the given chainId
 * @throws if the chainId is not found
 */
export const getChain = (chainId: number): Chain => {
  const allChains = [...Object.values(chains), ...CUSTOM_CHAINS];
  for (const chain of allChains) {
    if (chain.id === chainId) {
      return chain;
    }
  }
  throw new Error(
    "Chain not found. Please add a customChain into your config using the getCustomChain(...) helper, and the BiconomySmartAccountV2Config['customChain'] config option",
  );
};

export const stringOrStringsToArray = (str: string | string[]): string[] =>
  Array.isArray(str) ? str : [str];

type StringOrStrings = string | string[];
/**
 *
 * getCustomChain
 *
 * Utility method for creating a custom chain object
 *
 * @param name The name of the chain
 * @param id The chainId (number)
 * @param rpcUrl The RPC URL for the chain - may also be an array of URLs
 * @param blockExplorer The block explorer URL for the chain - may also be an array of URLs
 * @param nativeCurrency The native currency for the chain, ETH by default
 *
 * @example
 *
 * import { getCustomChain, createSmartAccountClient } from "@biconomy/account"
 *
 * const customChain = getCustomChain(
 *   "My Custom Chain",
 *   123456, // id
 *   "https://rpc.my-custom-chain.io", // Can also pass an array of URLs
 *   "https://explorer.my-custom-chain.io" // Can also pass an array of URLs
 * )
 *
 * const account = privateKeyToAccount(`0x${privateKey}`)
 * const walletClientWithCustomChain = createWalletClient({
 *   account,
 *   chain: customChain,
 *   transport: http()
 * })
 *
 * const smartAccountCustomChain = await createSmartAccountClient({
 *   signer: walletClientWithCustomChain,
 *   bundlerUrl,
 *   customChain
 * })
 *
 * const { wait } = await smartAccountCustomChain.sendTransaction({
 *   to: recipient,
 *   value: BigInt(1)
 * })
 *
 * const { success, receipt } = await wait();
 * console.log(success);
 *
 */
export const getCustomChain = (
  name: string,
  id: number,
  rpcUrl: StringOrStrings,
  blockExplorer: StringOrStrings,
  nativeCurrency?: Chain["nativeCurrency"],
  contracts?: Chain["contracts"],
): Chain => {
  const chain: Chain = {
    id,
    name,
    nativeCurrency: nativeCurrency ?? {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
    },
    rpcUrls: {
      default: { http: stringOrStringsToArray(rpcUrl) },
    },
    blockExplorers: {
      default: {
        name: "Explorer",
        url: stringOrStringsToArray(blockExplorer)[0],
      },
    },
    ...((contracts && { contracts }) || {}),
  };
  CUSTOM_CHAINS.push(chain);
  return chain;
};
