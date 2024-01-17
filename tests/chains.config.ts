import { localhost, Chain } from "viem/chains";
import { polygonMumbai, baseGoerli } from "viem/chains";
import { config } from "dotenv";

config();

export type SupportedTestChain = "ganache" | "baseGoerli" | "mumbai";
type BaseChainConfig = {
  chainId: number;
  entryPointAddress: string;
  bundlerUrl: string;
  paymasterUrl?: string;
  viemChain: Chain;
  biconomyPaymasterApiKey?: string;
};
export const CHAIN_CONFIG: Record<SupportedTestChain, BaseChainConfig> = {
  ganache: { // No useful bundler or paymaster tests for ganache
    chainId: 1337,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/1/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    viemChain: localhost,
  },
  baseGoerli: {
    chainId: 84531,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/84531/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/84531/" + process.env.E2E_BICO_PAYMASTER_KEY_BASE!,
    viemChain: baseGoerli,
    biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_BASE!,
  },
  mumbai: {
    chainId: 80001,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/80001/" + process.env.E2E_BICO_PAYMASTER_KEY_MUMBAI!,
    viemChain: polygonMumbai,
    biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_MUMBAI!,
  },
};
export const E2E_TEST_CHAINS = [CHAIN_CONFIG.mumbai, CHAIN_CONFIG.baseGoerli];
export const UNIT_TEST_CHAIN = CHAIN_CONFIG.ganache;

export default CHAIN_CONFIG;