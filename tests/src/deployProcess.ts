import { execa } from "execa"

export const deployProcess = async (rpcPort: number) => {
  await execa({
    cwd: "./node_modules/nexus"
  })`yarn install`
  await execa({
    cwd: "./node_modules/nexus"
  })`rm -rf ./deployments/anvil-${rpcPort}`
  return await execa({
    cwd: "./node_modules/nexus",
    env: {
      HH_RPC_URL: `http://localhost:${rpcPort}`,
      HH_CHAIN_NAME: `anvil-${rpcPort}`,
      HH_CHAIN_ID: rpcPort.toString()
    }
  })`yarn deploy:hardhat --network anvil-${rpcPort}`
}
