import { config } from "dotenv"
import getPort from "get-port"
import { alto, anvil } from "prool/instances"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  parseAbi,
  parseAbiParameters,
  publicActions,
  walletActions
} from "viem"
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts"
import {
  type EIP712DomainReturn,
  type NexusSmartAccount,
  createSmartAccountClient
} from "../../src"
import contracts from "../../src/__contracts"
import { getChain, getCustomChain } from "../../src/account/utils"
import { Logger } from "../../src/account/utils/Logger"
import { createBundler } from "../../src/bundler"
import {
  ENTRY_POINT_SIMULATIONS_CREATECALL,
  ENTRY_POINT_V07_CREATECALL,
  TEST_CONTRACTS
} from "./callDatas"
import { clean, deploy, init } from "./executables"

config()

type AnvilInstance = ReturnType<typeof anvil>
type BundlerInstance = ReturnType<typeof alto>
type BundlerDto = {
  bundlerInstance: BundlerInstance
  bundlerUrl: string
  bundlerPort: number
}
export type AnvilDto = {
  rpcUrl: string
  rpcPort: number
  chain: Chain
  instance: AnvilInstance
}
export type NetworkConfigWithBundler = AnvilDto & BundlerDto
export type NetworkConfig = Omit<
  NetworkConfigWithBundler,
  "instance" | "bundlerInstance"
> & {
  account?: PrivateKeyAccount
}
export const pKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // This is a publicly available private key meant only for testing only

export const getTestAccount = (
  addressIndex = 0
): ReturnType<typeof mnemonicToAccount> => {
  return mnemonicToAccount(
    "test test test test test test test test test test test junk",
    {
      addressIndex
    }
  )
}

const allInstances = new Map<number, AnvilInstance>()

export const killAllNetworks = () =>
  killNetwork(Array.from(allInstances.keys()))

export const killNetwork = (ids: number[]) =>
  Promise.all(
    ids.map(async (id) => {
      const instance = allInstances.get(id)
      if (instance) {
        await instance.stop()
        allInstances.delete(id)
      }
    })
  )

export const initTestnetNetwork = async (): Promise<NetworkConfig> => {
  const privateKey = process.env.E2E_PRIVATE_KEY_ONE
  const chainId = process.env.CHAIN_ID
  const rpcUrl = process.env.RPC_URL //Optional, taken from chain (using chainId) if not provided
  const _bundlerUrl = process.env.BUNDLER_URL // Optional, taken from chain (using chainId) if not provided

  let chain: Chain

  if (!privateKey) throw new Error("Missing env var E2E_PRIVATE_KEY_ONE")
  if (!chainId) throw new Error("Missing env var CHAIN_ID")

  try {
    chain = getChain(+chainId)
  } catch (e) {
    if (!rpcUrl) throw new Error("Missing env var RPC_URL")
    chain = getCustomChain("Custom Chain", +chainId, rpcUrl)
  }
  const bundlerUrl = _bundlerUrl ?? getBundlerUrl(+chainId)

  return {
    rpcUrl: chain.rpcUrls.default.http[0],
    rpcPort: 0,
    chain,
    bundlerUrl,
    bundlerPort: 0,
    account: privateKeyToAccount(
      privateKey?.startsWith("0x") ? (privateKey as Hex) : `0x${privateKey}`
    )
  }
}

export const initLocalhostNetwork =
  async (): Promise<NetworkConfigWithBundler> => {
    const configuredNetwork = await initAnvilPayload()
    const bundlerConfig = await initBundlerInstance({
      rpcUrl: configuredNetwork.rpcUrl
    })
    await ensureBundlerIsReady(
      bundlerConfig.bundlerUrl,
      getTestChainFromPort(configuredNetwork.rpcPort)
    )
    allInstances.set(
      configuredNetwork.instance.port,
      configuredNetwork.instance
    )
    allInstances.set(
      bundlerConfig.bundlerInstance.port,
      bundlerConfig.bundlerInstance
    )
    return { ...configuredNetwork, ...bundlerConfig }
  }

export type MasterClient = ReturnType<typeof toTestClient>
export const toTestClient = (chain: Chain, account: Account) =>
  createTestClient({
    mode: "anvil",
    chain,
    account,
    transport: http()
  })
    .extend(publicActions)
    .extend(walletActions)

export const toBundlerInstance = async ({
  rpcUrl,
  bundlerPort
}: {
  rpcUrl: string
  bundlerPort: number
}): Promise<BundlerInstance> => {
  const instance = alto({
    entrypoints: [contracts.entryPoint.address],
    rpcUrl: rpcUrl,
    executorPrivateKeys: [pKey],
    entrypointSimulationContract: contracts.entryPointSimulations.address,
    safeMode: false,
    port: bundlerPort
  })
  await instance.start()
  return instance
}

export const ensureBundlerIsReady = async (
  bundlerUrl: string,
  chain: Chain
) => {
  const bundler = await createBundler({
    chain,
    bundlerUrl
  })

  while (true) {
    try {
      await bundler.getGasFeeValues()
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

export const toConfiguredAnvil = async ({
  rpcPort
}: { rpcPort: number }): Promise<AnvilInstance> => {
  const instance = anvil({
    hardfork: "Paris",
    chainId: rpcPort,
    port: rpcPort,
    codeSizeLimit: 1000000000000
    // forkUrl: "https://base-sepolia.gateway.tenderly.co/2oxlNZ7oiNCUpXzrWFuIHx"
  })
  await instance.start()
  await deployContracts(rpcPort)
  await init()
  await clean()
  await deploy(rpcPort)
  return instance
}

const portOptions = { exclude: [] as number[] }
export const initAnvilPayload = async (): Promise<AnvilDto> => {
  const rpcPort = await getPort(portOptions)
  portOptions.exclude.push(rpcPort)
  const rpcUrl = `http://localhost:${rpcPort}`
  const chain = getTestChainFromPort(rpcPort)
  const instance = await toConfiguredAnvil({ rpcPort })
  return { rpcUrl, chain, instance, rpcPort }
}

export const initBundlerInstance = async ({
  rpcUrl
}: { rpcUrl: string }): Promise<BundlerDto> => {
  const bundlerPort = await getPort(portOptions)
  portOptions.exclude.push(bundlerPort)
  const bundlerUrl = `http://localhost:${bundlerPort}`
  const bundlerInstance = await toBundlerInstance({ rpcUrl, bundlerPort })
  return { bundlerInstance, bundlerUrl, bundlerPort }
}

export const checkBalance = (
  testClient: MasterClient,
  owner: Hex,
  tokenAddress?: Hex
) => {
  if (!tokenAddress) {
    return testClient.getBalance({ address: owner })
  }
  return testClient.readContract({
    address: tokenAddress,
    abi: parseAbi([
      "function balanceOf(address owner) public view returns (uint256 balance)"
    ]),
    functionName: "balanceOf",
    args: [owner]
  })
}

export const nonZeroBalance = async (
  testClient: MasterClient,
  address: Hex,
  tokenAddress?: Hex
) => {
  const balance = await checkBalance(testClient, address, tokenAddress)
  if (balance > BigInt(0)) return
  throw new Error(
    `Insufficient balance ${
      tokenAddress ? `of token ${tokenAddress}` : "of native token"
    } during test setup of owner: ${address}`
  )
}

export type FundedTestClients = Awaited<ReturnType<typeof toFundedTestClients>>
export const toFundedTestClients = async ({
  chain,
  bundlerUrl
}: { chain: Chain; bundlerUrl: string }) => {
  const account = getTestAccount(2)
  const recipientAccount = getTestAccount(3)

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const recipientWalletClient = createWalletClient({
    account: recipientAccount,
    chain,
    transport: http()
  })

  const testClient = toTestClient(chain, getTestAccount())

  const smartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl,
    chain
  })

  const recipientSmartAccount = await createSmartAccountClient({
    signer: recipientWalletClient,
    bundlerUrl,
    chain
  })

  const smartAccountAddress = await smartAccount.getAddress()
  const recipientSmartAccountAddress = await recipientSmartAccount.getAddress()
  await fundAndDeploy(testClient, [smartAccount, recipientSmartAccount])

  return {
    account,
    recipientAccount,
    walletClient,
    recipientWalletClient,
    testClient,
    smartAccount,
    recipientSmartAccount,
    smartAccountAddress,
    recipientSmartAccountAddress
  }
}

export const fundAndDeploy = async (
  testClient: MasterClient,
  smartAccounts: NexusSmartAccount[]
) =>
  Promise.all(
    smartAccounts.map((smartAccount) =>
      fundAndDeploySingleAccount(testClient, smartAccount)
    )
  )

export const fundAndDeploySingleAccount = async (
  testClient: MasterClient,
  smartAccount: NexusSmartAccount
) => {
  try {
    const accountAddress = await smartAccount.getAddress()
    await topUp(testClient, accountAddress)
    const { wait } = await smartAccount.deploy()
    const { success } = await wait()
    if (!success) {
      throw new Error("Failed to deploy smart account")
    }
  } catch (e) {
    Logger.error(`Error initializing smart account: ${e}`)
  }
}

export const safeTopUp = async (
  testClient: MasterClient,
  recipient: Hex,
  amount = 100000000000000000000n,
  token?: Hex
) => {
  try {
    return await topUp(testClient, recipient, amount, token)
  } catch (error) {
    Logger.error(`Error topping up account: ${error}`)
  }
}

export const topUp = async (
  testClient: MasterClient,
  recipient: Hex,
  amount = 100000000000000000000n,
  token?: Hex
) => {
  const balanceOfRecipient = await checkBalance(testClient, recipient, token)

  if (balanceOfRecipient > amount) {
    Logger.log(
      `balanceOfRecipient (${recipient}) already has enough ${
        token ?? "native token"
      } (${balanceOfRecipient}) during safeTopUp`
    )
    return await Promise.resolve()
  }

  Logger.log(`topping up (${recipient}): (${balanceOfRecipient}).`)

  if (token) {
    const hash = await testClient.writeContract({
      address: token,
      abi: parseAbi([
        "function transfer(address recipient, uint256 amount) external"
      ]),
      functionName: "transfer",
      args: [recipient, amount]
    })
    await testClient.waitForTransactionReceipt({ hash })
  }
  const hash = await testClient.sendTransaction({
    to: recipient,
    value: amount
  })
  return testClient.waitForTransactionReceipt({ hash })
}

// Returns the encoded EIP-712 domain struct fields.
export const getAccountDomainStructFields = async (
  testClient: MasterClient,
  accountAddress: Address
) => {
  const accountDomainStructFields = (await testClient.readContract({
    address: accountAddress,
    abi: parseAbi([
      "function eip712Domain() public view returns (bytes1 fields, string memory name, string memory version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] memory extensions)"
    ]),
    functionName: "eip712Domain"
  })) as EIP712DomainReturn

  const [fields, name, version, chainId, verifyingContract, salt, extensions] =
    accountDomainStructFields

  const params = parseAbiParameters(
    "bytes1, string, string, uint256, address, bytes32, uint256[]"
  )

  return encodeAbiParameters(params, [
    fields,
    name,
    version,
    chainId,
    verifyingContract,
    salt,
    extensions
  ])
}

export const getBundlerUrl = (chainId: number) =>
  `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`

const getTestChainFromPort = (port: number): Chain =>
  getCustomChain(`Anvil-${port}`, port, `http://localhost:${port}`, "")

const deployContracts = async (rpcPort: number): Promise<void> => {
  const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
  const chain = getTestChainFromPort(rpcPort)
  const account = getTestAccount()
  const testClient = toTestClient(chain, account)

  const entrypointSimulationHash = await testClient.sendTransaction({
    to: DETERMINISTIC_DEPLOYER,
    data: ENTRY_POINT_SIMULATIONS_CREATECALL,
    gas: 15_000_000n
  })

  const entrypointHash = await testClient.sendTransaction({
    to: DETERMINISTIC_DEPLOYER,
    data: ENTRY_POINT_V07_CREATECALL,
    gas: 15_000_000n
  })

  await Promise.all([
    testClient.waitForTransactionReceipt({ hash: entrypointSimulationHash }),
    testClient.waitForTransactionReceipt({ hash: entrypointHash })
  ])

  await byteCodeDeployer(testClient, TEST_CONTRACTS)
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export type DeployerParams = {
  name?: string
  chainId: number
  address: Address
}
export const byteCodeDeployer = async (
  testClient: MasterClient,
  deployParams: Record<string, DeployerParams>
) => {
  const deployParamsArray = Object.values(deployParams)

  const bytecodes = (await Promise.all(
    deployParamsArray.map(({ chainId, address }) => {
      const fetchChain = getChain(chainId)
      const publicClient = createPublicClient({
        chain: fetchChain,
        transport: http()
      })
      return publicClient.getBytecode({ address })
    })
  )) as Hex[]

  await Promise.all(
    deployParamsArray.map(({ address }, index) =>
      testClient.setCode({
        bytecode: bytecodes[index],
        address
      })
    )
  )
}
