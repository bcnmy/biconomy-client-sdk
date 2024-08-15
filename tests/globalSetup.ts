import getPort from "get-port"
import { anvil } from "prool/instances"
import type { Chain } from "viem"
import { anvil as anvilChain } from "viem/chains"

export const getAnvilInstance = async ({
  anvilPort
}: { anvilPort: number }) => {
  const anvilInstance = anvil({
    chainId: anvilChain.id,
    port: anvilPort,
    forkUrl: "https://base-sepolia.gateway.tenderly.co/2oxlNZ7oiNCUpXzrWFuIHx"
    // hardfork: "Prague"
  })
  // await setupContracts(`http://localhost:${anvilPort}`) // Required if not using the forkUrl
  await anvilInstance.start()
  return anvilInstance
}

export type ChainConfig = {
  anvilRpc: string
  chain: Chain
}

let anvilInstance: NonNullable<ReturnType<typeof anvil>>
let ports = [] as number[]
export default async function setup({ provide }) {
  const anvilPort = await getPort({ exclude: ports })
  ports.push(anvilPort)
  const anvilRpc = `http://localhost:${anvilPort}`
  anvilInstance = await getAnvilInstance({ anvilPort })
  const chain: Chain = {
    ...anvilChain,
    rpcUrls: { default: { http: [anvilRpc] } },
    testnet: true
  }
  provide("chainConfig", { anvilRpc, chain })
}

export const teardown = async () => {
  await anvilInstance.stop()
  ports = []
  console.log("Global teardown done")
}

declare module "vitest" {
  export interface ProvidedContext {
    chainConfig: ChainConfig
  }
}
