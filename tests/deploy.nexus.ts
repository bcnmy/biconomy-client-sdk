import { execa } from "execa"

export const deployProcess = async (rpcPort: number) => {
  await execa({
    cwd: "./node_modules/nexus"
  })`yarn install`
  await execa({
    cwd: "./node_modules/nexus"
  })`rm -rf ./deployments`
  return await execa({
    cwd: "./node_modules/nexus"
  })`yarn deploy:hardhat --network anvil-${rpcPort}`
}
