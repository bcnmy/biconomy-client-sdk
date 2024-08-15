import getPort from "get-port"
import { alto } from "prool/instances"
import { type Chain, anvil as anvilChain } from "viem/chains"
import { test } from "vitest"
import {
  DEFAULT_ENTRYPOINT_ADDRESS,
  ENTRY_POINT_SIMULATIONS_ADDRESS
} from "../src/account/utils/Constants"
import { getAnvilInstance } from "./globalSetup"

export const pKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // This is a publicly available private key meant only for testing only
export const pKeyTwo =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" // This is a publicly available private key meant only for testing only
export const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
export const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
export const eip1271MagicValue = "0x1626ba7e"

let ports: number[] = []

export const getBundlerInstance = async ({
  anvilPort,
  bundlerPort
}: { anvilPort: number; bundlerPort: number }) => {
  const anvilRpc = `http://localhost:${anvilPort}`
  const instance = alto({
    entrypoints: [DEFAULT_ENTRYPOINT_ADDRESS],
    rpcUrl: anvilRpc,
    executorPrivateKeys: [pKey],
    entrypointSimulationContract: ENTRY_POINT_SIMULATIONS_ADDRESS,
    safeMode: false,
    port: bundlerPort
  })
  await instance.start()
  return instance
}

export const testWithBundler = test.extend<{
  rpc: {
    anvilRpc: string
    bundlerUrl: string
    chain: Chain
  }
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  rpc: async ({}, use) => {
    const bundlerPort = await getPort({ exclude: ports })
    ports.push(bundlerPort)
    const anvilPort = await getPort({ exclude: ports })
    ports.push(anvilPort)
    const anvilRpc = `http://localhost:${anvilPort}`
    const bundlerUrl = `http://localhost:${bundlerPort}`

    const anvilInstance = await getAnvilInstance({ anvilPort })
    const bundlerInstance = await getBundlerInstance({ anvilPort, bundlerPort })
    const chain: Chain = {
      ...anvilChain,
      rpcUrls: { default: { http: [anvilRpc] } }
    }
    await use({ anvilRpc, bundlerUrl, chain })
    await Promise.all([anvilInstance.stop(), bundlerInstance.stop()])
    ports = ports.filter((port) => port !== bundlerPort || port !== anvilPort)
  }
})

export const globalSetup = async ({ provide }) => {}
