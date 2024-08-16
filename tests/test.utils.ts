import { type BigNumberish, ethers } from "ethers"
import getPort from "get-port"
import _throttle from "lodash/throttle"
import { alto, anvil } from "prool/instances"
import {
  http,
  type Abi,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type SetCodeParameters,
  createTestClient,
  encodeAbiParameters,
  parseAbi,
  parseAbiParameters,
  publicActions,
  walletActions
} from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { anvil as anvilChain } from "viem/chains"
import type { EIP712DomainReturn, NexusSmartAccount } from "../src"
import { getCustomChain } from "../src/account/utils"
import { Logger } from "../src/account/utils/Logger"
import { ENTRYPOINT_ADDRESS, ENTRYPOINT_SIMULATIONS } from "../src/contracts"
import { K1ValidatorAbi, NexusAbi } from "../src/contracts/abi"
import { K1ValidatorFactoryAbi } from "../src/contracts/abi/K1ValidatorFactoryAbi"
import deployedContracts from "./contracts/deployment.json"
import {
  ENTRY_POINT_SIMULATIONS_CREATECALL,
  ENTRY_POINT_V07_CREATECALL
} from "./create.config"

import {
  BiconomyMetaFactoryAbi,
  BootstrapAbi,
  BootstrapLibAbi,
  MockRegistryAbi,
  NexusAccountFactoryAbi
} from "./contracts/abi"

type AnvilPayload = {
  instance: AnvilInstance
  deployment: Deployment
}
type AnvilInstance = ReturnType<typeof anvil>
type BundlerInstance = ReturnType<typeof alto>
type BundlerDto = {
  bundlerInstance: BundlerInstance
  bundlerUrl: string
}
export type AnvilDto = {
  rpcUrl: string
  chain: Chain
  instance: AnvilInstance
  deployment: Deployment
}
export type ChainConfigWithBundler = AnvilDto & BundlerDto
export type ChainConfig = Omit<
  ChainConfigWithBundler,
  "instance" | "bundlerInstance"
>
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

export const initChain = async (): Promise<ChainConfigWithBundler> => {
  const configuredChain = await initAnvilPayload()
  const bundlerConfig = await initBundlerInstance({
    rpcUrl: configuredChain.rpcUrl
  })
  return { ...configuredChain, ...bundlerConfig }
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
    entrypoints: [ENTRYPOINT_ADDRESS],
    rpcUrl: rpcUrl,
    executorPrivateKeys: [pKey],
    entrypointSimulationContract: ENTRYPOINT_SIMULATIONS,
    safeMode: false,
    port: bundlerPort
  })
  await instance.start()
  return instance
}

export const toConfiguredAnvil = async ({
  rpcPort
}: { rpcPort: number }): Promise<AnvilPayload> => {
  const instance = anvil({
    hardfork: "Paris",
    chainId: anvilChain.id,
    port: rpcPort
    // forkUrl: "https://base-sepolia.gateway.tenderly.co/2oxlNZ7oiNCUpXzrWFuIHx"
  })
  await instance.start()
  const deployment = await deploy(rpcPort)
  return { instance, deployment }
}

export const initAnvilPayload = async (): Promise<AnvilDto> => {
  const rpcPort = await getPort()
  const rpcUrl = `http://localhost:${rpcPort}`
  const chain = getTestChainFromPort(rpcPort)
  const { instance, deployment } = await toConfiguredAnvil({ rpcPort })
  return { rpcUrl, chain, instance, deployment }
}

export const initBundlerInstance = async ({
  rpcUrl
}: { rpcUrl: string }): Promise<BundlerDto> => {
  const bundlerPort = await getPort()
  const bundlerUrl = `http://localhost:${bundlerPort}`
  const bundlerInstance = await toBundlerInstance({ rpcUrl, bundlerPort })
  return { bundlerInstance, bundlerUrl }
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
  getCustomChain(`Anvil-${port}`, anvilChain.id, `http://localhost:${port}`, "")

type Deployment = {
  bootrapAddress: Address
  nexusAddress: Address
  bootstrapLibAddress: Address
  k1ValidatorAddress: Address
  mockRegistryAddress: Address
  k1FactoryAddress: Address
  biconomyMetaFactoryAddress: Address
  // Mock Contracts for testing
  counterAddress: Address
  stakeableAddress: Address
  mockExecutorAddress: Address
  mockHandlerAddress: Address
  mockTokenAddress: Address
  mockValidatorAddress: Address
  mockHookAddress: Address
}

const deploy = async (rpcPort: number): Promise<Deployment> => {
  const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
  const chain = getTestChainFromPort(rpcPort)
  const account = getTestAccount()
  const testClient = toTestClient(chain, account)

  let nonce = await testClient.getTransactionCount({
    address: account.address
  })

  await Promise.all([
    testClient.sendTransaction({
      to: DETERMINISTIC_DEPLOYER,
      data: ENTRY_POINT_SIMULATIONS_CREATECALL,
      gas: 15_000_000n,
      nonce: nonce++
    }),
    testClient.sendTransaction({
      to: DETERMINISTIC_DEPLOYER,
      data: ENTRY_POINT_V07_CREATECALL,
      gas: 15_000_000n,
      nonce: nonce++
    })
  ])

  const bootstrapHash = await testClient.deployContract({
    bytecode: deployedContracts.Bootstrap.bytecode as Hex,
    abi: BootstrapAbi
  })

  const nexusHash = await testClient.deployContract({
    bytecode: deployedContracts.Nexus.bytecode as Hex,
    abi: NexusAbi,
    args: [ENTRYPOINT_ADDRESS]
  })

  const bootstrapLibHash = await testClient.deployContract({
    bytecode: deployedContracts.BootstrapLib.bytecode as Hex,
    abi: BootstrapLibAbi
  })

  const k1ValidatorHash = await testClient.deployContract({
    bytecode: deployedContracts.K1Validator.bytecode as Hex,
    abi: K1ValidatorAbi
  })

  const mockRegistryHash = await testClient.deployContract({
    bytecode: deployedContracts.MockRegistry.bytecode as Hex,
    abi: MockRegistryAbi
  })

  const biconomyMetaFactoryHash = await testClient.deployContract({
    bytecode: deployedContracts.BiconomyMetaFactory.bytecode as Hex,
    abi: BiconomyMetaFactoryAbi as Abi,
    args: [account.address]
  })

  const receipts = await Promise.all([
    testClient.waitForTransactionReceipt({ hash: bootstrapHash }),
    testClient.waitForTransactionReceipt({ hash: nexusHash }),
    testClient.waitForTransactionReceipt({ hash: bootstrapLibHash }),
    testClient.waitForTransactionReceipt({ hash: k1ValidatorHash }),
    testClient.waitForTransactionReceipt({ hash: mockRegistryHash }),
    testClient.waitForTransactionReceipt({ hash: biconomyMetaFactoryHash })
  ])

  // Setup the Mock Contracts
  await Promise.all([
    testClient.setCode(deployedContracts.Counter as SetCodeParameters),
    testClient.setCode(deployedContracts.Stakeable as SetCodeParameters),
    testClient.setCode(deployedContracts.MockExecutor as SetCodeParameters),
    testClient.setCode(deployedContracts.MockHandler as SetCodeParameters),
    testClient.setCode(deployedContracts.MockToken as SetCodeParameters),
    testClient.setCode(deployedContracts.MockValidator as SetCodeParameters),
    testClient.setCode(deployedContracts.MockHook as SetCodeParameters)
  ])

  const counterAddress = deployedContracts.Counter.address as Hex
  const stakeableAddress = deployedContracts.Stakeable.address as Hex
  const mockExecutorAddress = deployedContracts.MockExecutor.address as Hex
  const mockHandlerAddress = deployedContracts.MockHandler.address as Hex
  const mockTokenAddress = deployedContracts.MockToken.address as Hex
  const mockValidatorAddress = deployedContracts.MockValidator.address as Hex
  const mockHookAddress = deployedContracts.MockHook.address as Hex

  const [
    bootrapAddress,
    nexusAddress,
    bootstrapLibAddress,
    k1ValidatorAddress,
    mockRegistryAddress,
    biconomyMetaFactoryAddress
  ] = receipts.map((receipt) => receipt.contractAddress)

  const k1ValidatorAddressHash = await testClient.deployContract({
    bytecode: deployedContracts.K1ValidatorFactory.bytecode as Hex,
    abi: K1ValidatorFactoryAbi as Abi,
    args: [
      nexusAddress,
      account.address,
      k1ValidatorAddress,
      bootrapAddress,
      mockRegistryAddress
    ]
  })

  const nexusAccountFactoryHash = await testClient.deployContract({
    bytecode: deployedContracts.NexusAccountFactory.bytecode as Hex,
    abi: NexusAccountFactoryAbi as Abi,
    args: [nexusAddress, account.address]
  })

  const [k1FactoryReceipt, nexusAccountFactoryReceipt] = await Promise.all([
    testClient.waitForTransactionReceipt({
      hash: k1ValidatorAddressHash
    }),
    testClient.waitForTransactionReceipt({
      hash: nexusAccountFactoryHash
    })
  ])

  const k1FactoryAddress = k1FactoryReceipt.contractAddress
  const nexusAccountFactoryAddress = nexusAccountFactoryReceipt.contractAddress

  if (
    !biconomyMetaFactoryAddress ||
    !nexusAccountFactoryAddress ||
    !k1FactoryAddress ||
    !k1FactoryAddress ||
    !bootrapAddress ||
    !nexusAddress ||
    !bootstrapLibAddress ||
    !k1ValidatorAddress ||
    !mockRegistryAddress ||
    !counterAddress ||
    !stakeableAddress ||
    !mockExecutorAddress ||
    !mockHandlerAddress ||
    !mockTokenAddress ||
    !mockValidatorAddress ||
    !mockHookAddress
  ) {
    throw new Error("Failed to deploy contracts")
  }

  const deployment: Deployment = {
    biconomyMetaFactoryAddress,
    bootrapAddress,
    nexusAddress,
    bootstrapLibAddress,
    k1ValidatorAddress,
    mockRegistryAddress,
    k1FactoryAddress,
    counterAddress,
    stakeableAddress,
    mockExecutorAddress,
    mockHandlerAddress,
    mockTokenAddress,
    mockValidatorAddress,
    mockHookAddress
  }

  return deployment
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
