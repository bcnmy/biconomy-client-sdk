import { type NetworkConfig, initNetwork, killAllNetworks } from "./test.utils"

export async function setup({ provide }) {
  const network = await initNetwork()
  const { bundlerInstance, instance, ...serializeableConfig } = network
  provide("globalNetwork", serializeableConfig)
}

export async function teardown() {
  await killAllNetworks()
}

declare module "vitest" {
  export interface ProvidedContext {
    globalNetwork: NetworkConfig
  }
}
