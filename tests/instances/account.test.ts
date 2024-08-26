import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import contracts from "../../src/__contracts"
import {
  type NexusSmartAccount,
  type Transaction,
  createSmartAccountClient
} from "../../src/account"
import {
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp,
  writeToFile
} from "../test.utils"
import type { MasterClient, NetworkConfig } from "../test.utils"
import { type TestFileNetworkType, toNetwork } from "../testSetup"

const NETWORK_TYPE: TestFileNetworkType = "GLOBAL"

describe("account", () => {
  let network: NetworkConfig

  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let factoryAddress: Hex
  let k1ValidatorAddress: Hex
  let walletClient: WalletClient

  // Test utils
  let testClient: MasterClient
  let account: Account
  let recipientAccount: Account
  let smartAccount: NexusSmartAccount
  let smartAccountAddress: Hex

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)

    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = getTestAccount(0)
    recipientAccount = getTestAccount(3)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, getTestAccount(0))

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain
    })

    smartAccountAddress = await smartAccount.getAddress()
    // await fundAndDeploy(testClient, smartAccount)
  })
  afterAll(async () => {
    await killNetwork([network.rpcPort, network.bundlerPort])
  })

  test("byteCodes", async () => {
    const byteCodes = await Promise.all([
      testClient.getBytecode({ address: contracts.k1ValidatorFactory.address }),
      testClient.getBytecode({ address: contracts.k1Validator.address })
    ])
    const [k1ValidatorFactory, k1Validator] = byteCodes
    writeToFile("byteCodes.json", { k1ValidatorFactory, k1Validator })
    expect(byteCodes.every(Boolean)).toBe(true)
  })

  test("topUp", async () => {
    const total = await testClient.getBalance({
      address: testClient.account.address
    })
    await topUp(testClient, smartAccountAddress)
    const [balance] = await smartAccount.getBalances()
    expect(balance.amount > 0)
  })

  test("should have account addresses", async () => {
    const addresses = await Promise.all([
      account.address,
      smartAccount.getAddress()
    ])
    expect(addresses.every(Boolean)).to.be.true
    expect(addresses).toStrictEqual([
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x473AecE3DE762252a9d47F5032133282c9615e28" // Sender smart account
    ])
  })

  test("send eth", async () => {
    const tx: Transaction = {
      to: account.address,
      value: 1n
    }

    const { wait } = await smartAccount.sendTransaction(tx)

    const { success, receipt } = await wait()

    expect(success).toBe(true)
  })
})
