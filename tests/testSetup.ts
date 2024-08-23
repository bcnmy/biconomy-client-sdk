import { inject, test } from "vitest"
import {
  type FundedTestClients,
  type NetworkConfigWithBundler,
  initNetwork,
  toFundedTestClients
} from "./test.utils"

export type NetworkConfigWithTestClients = NetworkConfigWithBundler & {
  fundedTestClients: FundedTestClients
}

export const scopedTest = test.extend<{
  config: NetworkConfigWithTestClients
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  config: async ({}, use) => {
    const testNetwork = await initNetwork()
    const fundedTestClients = await toFundedTestClients(testNetwork)
    await use({ ...testNetwork, fundedTestClients })
    await Promise.all([
      testNetwork.instance.stop(),
      testNetwork.bundlerInstance.stop()
    ])
  }
})
