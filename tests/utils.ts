import { type Chain, type Hex, type PublicClient, parseAbi } from "viem"
import { getChain } from "../src/account"
import {
  extractChainIdFromBundlerUrl,
  extractChainIdFromPaymasterUrl
} from "../src/bundler"

export const getEnvVars = () => {
  const fields = [
    "BUNDLER_URL",
    "PRIVATE_KEY",
    "E2E_PRIVATE_KEY_TWO",
    "E2E_BICO_PAYMASTER_KEY_MUMBAI",
    "E2E_BICO_PAYMASTER_KEY_BASE",
    "CHAIN_ID"
  ]
  const errorFields = fields.filter((field) => !process.env[field])
  if (errorFields.length) {
    throw new Error(
      `Missing environment variable${
        errorFields.length > 1 ? "s" : ""
      }: ${errorFields.join(", ")}`
    )
  }
  return {
    bundlerUrl: process.env.BUNDLER_URL || "",
    privateKey: process.env.PRIVATE_KEY || "",
    privateKeyTwo: process.env.E2E_PRIVATE_KEY_TWO || "",
    paymasterUrl: process.env.E2E_BICO_PAYMASTER_KEY_MUMBAI || "",
    paymasterUrlTwo: process.env.E2E_BICO_PAYMASTER_KEY_BASE || "",
    chainId: process.env.CHAIN_ID || "0"
  }
}

export type TestConfig = {
  chain: Chain
  chainId: number
  paymasterUrl: string
  paymasterUrlTwo: string
  bundlerUrl: string
  privateKey: string
  privateKeyTwo: string
}
export const getConfig = (): TestConfig => {
  const {
    paymasterUrl,
    paymasterUrlTwo,
    bundlerUrl,
    chainId: chainIdFromEnv,
    privateKey,
    privateKeyTwo
  } = getEnvVars()
  const chains = [Number.parseInt(chainIdFromEnv)]
  const chainId = chains[0]
  const chain = getChain(chainId)

  try {
    const chainIdFromBundlerUrl = extractChainIdFromBundlerUrl(bundlerUrl)
    chains.push(chainIdFromBundlerUrl)
  } catch (e) {}

  try {
    const chainIdFromPaymasterUrl = extractChainIdFromPaymasterUrl(paymasterUrl)
    chains.push(chainIdFromPaymasterUrl)
  } catch (e) {}

  const allChainsMatch = chains.every((chain) => chain === chains[0])

  if (!allChainsMatch) {
    throw new Error("Chain IDs do not match")
  }

  return {
    chain,
    chainId,
    paymasterUrl,
    paymasterUrlTwo,
    bundlerUrl,
    privateKey,
    privateKeyTwo
  }
}

export const checkBalance = (
  publicClient: PublicClient,
  address: Hex,
  tokenAddress?: Hex
) => {
  if (!tokenAddress) {
    return publicClient.getBalance({ address })
  }
  return publicClient.readContract({
    address: tokenAddress,
    abi: parseAbi([
      "function balanceOf(address owner) view returns (uint balance)"
    ]),
    functionName: "balanceOf",
    // @ts-ignore
    args: [address]
  })
}

export const getBundlerUrl = (chainId: number) =>
  `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`
