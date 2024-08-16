import {
  type ChainConfig,
  type ChainConfigWithBundler,
  initChain
} from "./test.utils"

let globalConfig: ChainConfigWithBundler
export default async function setup({ provide }) {
  globalConfig = await initChain()
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
    globalNetwork: ChainConfig
  }
}
