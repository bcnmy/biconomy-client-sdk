import {
  http,
  type Account,
  type Address,
  type Chain,
  type WalletClient,
  createWalletClient,
  isHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../tests/src/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../tests/src/testUtils"
import contracts from "../__contracts"
import { type BiconomyClient, createBiconomyClient } from "./biconomy"

describe("biconomy.argle", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient

  // Test utils
  let testClient: MasterClient
  let account: Account
  let biconomyAccountAddress: Address
  let biconomy: BiconomyClient

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, getTestAccount(0))

    biconomy = await createBiconomyClient({
      owner: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    biconomyAccountAddress = await biconomy.account.getCounterFactualAddress()
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should check balances and top up relevant addresses", async () => {
    const [ownerBalance, smartAccountBalance] = await Promise.all([
      testClient.getBalance({
        address: account.address
      }),
      testClient.getBalance({
        address: biconomyAccountAddress
      })
    ])
    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )

    if (smartAccountBalance < 100000000000000000n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account,
        to: biconomyAccountAddress,
        value: 100000000000000000n
      })
      await testClient.waitForTransactionReceipt({ hash })
    }

    const smartAccountBalanceAfterTopUp = await testClient.getBalance({
      address: biconomyAccountAddress
    })

    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should have a working bundler client", async () => {
    const chainId = await biconomy.getChainId()
    expect(chainId).toEqual(chain.id)

    const supportedEntrypoints = await biconomy.getSupportedEntryPoints()
    expect(supportedEntrypoints).to.include(contracts.entryPoint.address)
  })

  test("should send a user operation", async () => {
    const calls = [{ to: account.address, value: 1n }]
    const feeData = await testClient.estimateFeesPerGas()

    const gas = {
      maxFeePerGas: feeData.maxFeePerGas * 2n,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 2n
    }

    const hash = await biconomy.sendUserOperation({ calls, ...gas })
    const receipt = await biconomy.waitForUserOperationReceipt({ hash })

    expect(receipt.success).toEqual(true)
  })

  test("should send a userop using the biconomy stack", async () => {
    const calls = [{ to: account.address, value: 1n }]

    const hash = await biconomy.sendTransaction({ calls })
    const receipt = await biconomy.waitForUserOperationReceipt({ hash })

    console.log({ receipt })

    expect(receipt.success).toEqual(true)
  })

  test("should call some erc7579 actions", async () => {
    expect(biconomy.isModuleInstalled).toBeTruthy()
    const supportsExecutionMode = await biconomy.supportsExecutionMode({
      type: "delegatecall",
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      account: biconomy.account!
    })
    console.log({ supportsExecutionMode })
  })

  test("should produce the same results", async () => {
    const nexusInitCode = biconomy.account.getInitCode()
    expect(nexusInitCode).toBeTruthy()

    const nexusFactoryData = biconomy.account.factoryData
    expect(isHex(nexusFactoryData)).toBeTruthy()

    const nexusIsDeployed = await biconomy.account.isDeployed()
    expect(nexusIsDeployed).toBeTruthy()
  })
})
