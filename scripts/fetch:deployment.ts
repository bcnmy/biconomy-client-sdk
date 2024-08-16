const fs = require("node:fs")

const path =
  process.argv.slice(2)?.[0]?.split("=")?.[1] ??
  "../../nexus/deployments/localhost"
const relativePath = `${__dirname}/${path}`

type DeployedContract = {
  address: string
  bytecode: string
}

const ABIS_REQUIRED_IN_CORE = [
  "K1ValidatorFactory",
  "Nexus",
  "MockExecutor",
  "K1Validator"
]

export const getDeployments = async () => {
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
      const { address, abi, bytecode } = JSON.parse(contents)

      const isForCore = ABIS_REQUIRED_IN_CORE.includes(name)
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
        ? `${__dirname}/../src/contracts/abi/${name}Abi.ts`
        : `${__dirname}/../tests/contracts/abi/${name}Abi.ts`

      fs.writeFileSync(tsAbiPath, tsAbiContent)

      deployedContracts[name] = {
        address,
        bytecode
      }
    }
  }

  // Write ABI index file...
  const abiIndexContent = `export * from "./EntryPointABI"\n${coreFiles
    .map((file) => `export * from "./${file}Abi"`)
    .join("\n")}`

  // Write test ABI index file for tests
  const testAbiIndexContent = `${testFiles
    .map((file) => `export * from "./${file}Abi"`)
    .join("\n")}`

  // Write the ABIs
  const abiIndexPath = `${__dirname}/../src/contracts/abi/index.ts`
  fs.writeFileSync(abiIndexPath, abiIndexContent)

  const testAbiIndexPath = `${__dirname}/../tests/contracts/abi/index.ts`
  fs.writeFileSync(testAbiIndexPath, testAbiIndexContent)

  // Write deployemts to tests folder
  const writePath = `${__dirname}/../tests/contracts/deployment.json`
  fs.writeFileSync(writePath, JSON.stringify(deployedContracts, null, 2))

  // Write addresses to src folder
  const writeAddressesPath = `${__dirname}/../src/contracts/addresses.ts`
  const addressesContent = `import type { Hex } from "viem"\nexport const deployedContracts: Record<string, Hex> = ${JSON.stringify(
    Object.keys(deployedContracts).reduce((acc, key) => {
      acc[key] = deployedContracts[key].address
      return acc
    }, {}),
    null,
    2
  )}\n`

  fs.writeFileSync(writeAddressesPath, addressesContent)
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
