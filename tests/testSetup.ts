import { inject, test } from "vitest"
import { type ChainConfigWithBundler, initChain } from "./test.utils"

export const testWithBundler = test.extend<{
  rpc: ChainConfigWithBundler
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  rpc: async ({}, use) => {
    const testChain = await initChain()
    await use({ ...testChain })
    await Promise.all([
      testChain.instance.stop(),
      testChain.bundlerInstance.stop()
    ])
  }
})

export type TestFileNetworkType = "LOCAL" | "GLOBAL"
export const toNetwork = async (networkType: TestFileNetworkType) =>
  // @ts-ignore
  await (networkType === "GLOBAL" ? inject("globalNetwork") : initChain())
