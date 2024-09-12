import { describe, inject, test } from "vitest"
import {
  type FundedTestClients,
  type NetworkConfig,
  type NetworkConfigWithBundler,
  initLocalhostNetwork,
  initTestnetNetwork,
  toFundedTestClients
} from "./testUtils"

export type NetworkConfigWithTestClients = NetworkConfigWithBundler & {
  fundedTestClients: FundedTestClients
}

export const localhostTest = test.extend<{
  config: NetworkConfigWithTestClients
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  config: async ({}, use) => {
    const testNetwork = await initLocalhostNetwork()
    const fundedTestClients = await toFundedTestClients({
      chain: testNetwork.chain,
      bundlerUrl: testNetwork.bundlerUrl
    })
    await use({ ...testNetwork, fundedTestClients })
    await Promise.all([
      testNetwork.instance.stop(),
      testNetwork.bundlerInstance.stop()
    ])
  }
})

export const testnetTest = test.extend<{
  config: NetworkConfig
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  config: async ({}, use) => {
    const testNetwork = await toNetwork("PUBLIC_TESTNET")
    await use(testNetwork)
  }
})

export type TestFileNetworkType =
  | "FILE_LOCALHOST"
  | "COMMON_LOCALHOST"
  | "PUBLIC_TESTNET"

export const toNetwork = async (
  networkType: TestFileNetworkType
): Promise<NetworkConfig> =>
  await (networkType === "COMMON_LOCALHOST"
    ? // @ts-ignore
      inject("globalNetwork")
    : networkType === "FILE_LOCALHOST"
      ? initLocalhostNetwork()
      : initTestnetNetwork())

export const describeWithPlaygroundGuard =
  process.env.RUN_PLAYGROUND === "true" ? describe : describe.skip

export const describeWithPaymasterGuard = process.env.PAYMASTER_URL
  ? describe
  : describe.skip
