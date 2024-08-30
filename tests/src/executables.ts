import { execa } from "execa"

const cwd = "./node_modules/nexus"

export const init = async () => await execa({ cwd })`yarn install`

export const cleanOne = async (rpcPort: number) =>
  await execa({ cwd })`rm -rf ./deployments/anvil-${rpcPort}`

export const deploy = async (rpcPort: number) => {
  await cleanOne(rpcPort)
  return await execa({
    cwd,
    env: {
      HH_RPC_URL: `http://localhost:${rpcPort}`,
      HH_CHAIN_NAME: `anvil-${rpcPort}`,
      HH_CHAIN_ID: rpcPort.toString()
    }
  })`yarn deploy:hardhat --network anvil-${rpcPort}`
}

export const clean = async () => await execa({ cwd })`rm -rf ./deployments`
