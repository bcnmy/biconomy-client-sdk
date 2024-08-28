import {
  type NetworkConfig,
  type NetworkConfigWithBundler,
  initNetwork
} from "./testUtils"

let globalConfig: NetworkConfigWithBundler
export const setup = async ({ provide }) => {
  globalConfig = await initNetwork()
  const { bundlerInstance, instance, ...serializeableConfig } = globalConfig
  provide("globalNetwork", serializeableConfig)
}

export const teardown = async () => {
  await Promise.all([
    globalConfig.instance.stop(),
    globalConfig.bundlerInstance.stop()
  ])
}

declare module "vitest" {
  export interface ProvidedContext {
    globalNetwork: NetworkConfig
  }
}
