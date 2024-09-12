import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  encodeFunctionData,
  encodePacked
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import addresses from "../src/__contracts/addresses"
import {
  type NexusSmartAccount,
  type Transaction,
  createSmartAccountClient
} from "../src/account"
import { CounterAbi } from "./src/__contracts/abi"
import { mockAddresses } from "./src/__contracts/mockAddresses"
import { OWNABLE_VALIDATOR } from "./src/callDatas"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "./src/testUtils"
import type { MasterClient, NetworkConfig } from "./src/testUtils"

const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"

describe("modules.k1Validator.write", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
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
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should fund the smart account", async () => {
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
      "0x9faF274EB7cc2D342d786Ad0995dB3c0d641446d" // Sender smart account
    ])
  })

  test("should send eth", async () => {
    const balanceBefore = await testClient.getBalance({
      address: recipientAccount.address
    })
    const tx: Transaction = {
      to: recipientAccount.address,
      value: 1n
    }
    const { wait } = await smartAccount.sendTransaction(tx)
    const { success } = await wait()
    const balanceAfter = await testClient.getBalance({
      address: recipientAccount.address
    })
    expect(success).toBe(true)
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should install k1 Validator with 1 owner", async () => {
    const isInstalledBefore = await smartAccount.isModuleInstalled({
      type: "validator",
      moduleAddress: addresses.K1Validator
    })

    if (!isInstalledBefore) {
      const { wait } = await smartAccount.installModule({
        moduleAddress: addresses.K1Validator,
        type: "validator",
        data: encodePacked(["address"], [await smartAccount.getAddress()])
      })

      const { success: installSuccess } = await wait()
      expect(installSuccess).toBe(true)

      const { wait: uninstallWait } = await smartAccount.uninstallModule({
        moduleAddress: addresses.K1Validator,
        type: "validator",
        data: encodePacked(["address"], [await smartAccount.getAddress()])
      })
      const { success: uninstallSuccess } = await uninstallWait()
      expect(uninstallSuccess).toBe(true)
    }
  }, 60000)

  test.skip("should have the Ownable Validator Module installed", async () => {
    const isInstalled = await smartAccount.isModuleInstalled({
      type: "validator",
      moduleAddress: OWNABLE_VALIDATOR
    })
    expect(isInstalled).toBeTruthy()
  }, 60000)

  test("should perform a contract interaction", async () => {
    const encodedCall = encodeFunctionData({
      abi: CounterAbi,
      functionName: "incrementNumber"
    })

    const transaction = {
      to: mockAddresses.Counter,
      data: encodedCall
    }

    const response = await smartAccount.sendTransaction([transaction])
    const receipt = await response.wait()

    expect(receipt.success).toBe(true)
  }, 60000)
})
