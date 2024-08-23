import { type ChainConfig, initChain, killAllNetworks } from "./test.utils"

export async function setup({ provide }) {
  const network = await initChain()
  const { bundlerInstance, instance, ...serializeableConfig } = network
  provide("globalNetwork", serializeableConfig)
}

export async function teardown() {
  await killAllNetworks()
}

declare module "vitest" {
  export interface ProvidedContext {
    globalNetwork: ChainConfig
  }
}
