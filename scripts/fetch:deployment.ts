import fs from "node:fs"

import { hideBin } from "yargs/helpers"
import yargs from "yargs/yargs"

type FetchDetails = {
  nexusDeploymentPath: string
  chainName: string
  forSrc: string[]
}
const {
  nexusDeploymentPath = "../node_modules/nexus/deployments",
  chainName = "anvil-52280",
  forSrc = ["K1ValidatorFactory", "Nexus", "K1Validator"]
} = yargs(hideBin(process.argv)).argv as unknown as FetchDetails

type DeployedContract = {
  address: string
}

export const getDeployments = async () => {
  const relativePath = `${__dirname}/${nexusDeploymentPath}/${chainName}`
  console.log("Fetching deployments from:", relativePath)
  const files = fs.readdirSync(relativePath)
  const deployedContracts: Record<string, DeployedContract> = {}

  const coreFiles: string[] = []
  const testFiles: string[] = []

  for (const file of files) {
    if (file.includes(".json")) {
      const name = `${file.split(".")[0]}`
      const jsonFileNameWithExtension = `${name}.json`
      const contents = fs.readFileSync(
        `${relativePath}/${jsonFileNameWithExtension}`,
        "utf8"
      )
      const { address, abi } = JSON.parse(contents)

      const isForCore = forSrc.includes(name)
      if (isForCore) {
        coreFiles.push(name)
      } else {
        testFiles.push(name)
      }

      const tsAbiContent = `export const ${name}Abi = ${JSON.stringify(
        abi,
        null,
        2
      )} as const;\n`

      const tsAbiPath = isForCore
        ? `${__dirname}/../src/__contracts/abi/${name}Abi.ts`
        : `${__dirname}/../tests/src/__contracts/abi/${name}Abi.ts`

      fs.writeFileSync(tsAbiPath, tsAbiContent)

      deployedContracts[name] = {
        address
      }
    }
  }

  // Write ABI index file...
  const abiIndexContent = `export * from "./UniActionPolicyAbi"\nexport * from "./EntryPointABI"\n${coreFiles
    .map((file) => `export * from "./${file}Abi"`)
    .join("\n")}`

  // Write test ABI index file for tests
  const testAbiIndexContent = `${testFiles
    .map((file) => `export * from "./${file}Abi"`)
    .join("\n")}`

  // Write the ABIs
  const abiIndexPath = `${__dirname}/../src/__contracts/abi/index.ts`
  fs.writeFileSync(abiIndexPath, abiIndexContent)

  const testAbiIndexPath = `${__dirname}/../tests/src/__contracts/abi/index.ts`
  fs.writeFileSync(testAbiIndexPath, testAbiIndexContent)

  // Write addresses to src folder
  const writeAddressesPath = `${__dirname}/../src/__contracts/addresses.ts`
  const writeAddressesPathTest = `${__dirname}/../tests/src/__contracts/mockAddresses.ts`

  const addressesContent = `// The contents of this folder is auto-generated. Please do not edit as your changes are likely to be overwritten\n
  import type { Hex } from "viem"\nexport const addresses: Record<string, Hex> = ${JSON.stringify(
    Object.keys(deployedContracts)
      .filter((key) => coreFiles.includes(key))
      .reduce((acc, key) => {
        acc[key] = deployedContracts[key].address
        return acc
      }, {}),
    null,
    2
  )} as const;\nexport default addresses\n`

  const testAddressesContent = `// The contents of this folder is auto-generated. Please do not edit as your changes are likely to be overwritten\n
  import type { Hex } from "viem"\nexport const mockAddresses: Record<string, Hex> = ${JSON.stringify(
    Object.keys(deployedContracts)
      .filter((key) => testFiles.includes(key))
      .reduce((acc, key) => {
        acc[key] = deployedContracts[key].address
        return acc
      }, {}),
    null,
    2
  )} as const;\nexport default mockAddresses\n`

  fs.writeFileSync(writeAddressesPath, addressesContent)
  fs.writeFileSync(writeAddressesPathTest, testAddressesContent)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
getDeployments()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
