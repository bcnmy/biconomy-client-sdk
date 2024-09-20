import {
  type NetworkConfig,
  type NetworkConfigWithBundler,
  initLocalhostNetwork
} from "./testUtils"

let globalConfig: NetworkConfigWithBundler
// @ts-ignore
export const setup = async ({ provide }) => {
  globalConfig = await initLocalhostNetwork()
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
