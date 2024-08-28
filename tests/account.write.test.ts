import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
  type Transaction,
  createSmartAccountClient
} from "../src/account"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "./src/testUtils"
import type { MasterClient, NetworkConfig } from "./src/testUtils"

const NETWORK_TYPE: TestFileNetworkType = "LOCAL"

describe("account.write", () => {
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
      "0xa3962DB24D3cAb711e18d5A508591C6dB82a0f54" // Sender smart account
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

  //   test("install a mock Hook module", async () => {
  //     const isSupported = await smartAccount.supportsModule(ModuleType.Hook)
  //     console.log(isSupported, "is supported")

  //     const isInstalledBefore = await smartAccount.isModuleInstalled(
  //       ModuleType.Hook,
  //       MOCK_HOOK
  //     )
  //     console.log(isInstalledBefore, "is installed before")

  //     const userOpReceipt = await smartAccount.installModule(MOCK_HOOK, ModuleType.Hook)
  //     console.log(userOpReceipt, "user op receipt")

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hook,
  //       MOCK_HOOK
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeTruthy()
  //   }, 60000)

  //   test("get active hook", async () => {
  //     const activeHook: Address = await smartAccount.getActiveHook()
  //     console.log(activeHook, "active hook")
  //     expect(activeHook).toBe(MOCK_HOOK)
  //   }, 60000)

  //   test("uninstall hook module", async () => {
  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = encodeAbiParameters(
  //       [
  //         { name: "prev", type: "address" },
  //         { name: "disableModuleData", type: "bytes" }
  //       ],
  //       [prevAddress, toHex(stringToBytes(""))]
  //     )
  //     const userOpReceipt = await smartAccount.uninstallModule(MOCK_HOOK, ModuleType.Hook, deInitData)

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hook,
  //       MOCK_HOOK
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)

  //   test("install a fallback handler Hook module", async () => {
  //     const isSupported = await smartAccount.supportsModule(ModuleType.Fallback)
  //     console.log(isSupported, "is supported")

  //     const isInstalledBefore = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER,
  //       ethers.AbiCoder.defaultAbiCoder().encode(
  //         ["bytes4"],
  //         [GENERIC_FALLBACK_SELECTOR as Hex]
  //       ) as Hex
  //     )
  //     console.log(isInstalledBefore, "is installed before")

  //     const userOpReceipt = await smartAccount.installModule(MOCK_FALLBACK_HANDLER, ModuleType.Fallback, ethers.AbiCoder.defaultAbiCoder().encode(
  //       ["bytes4"],
  //       [GENERIC_FALLBACK_SELECTOR as Hex]
  //     ) as Hex)

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER,
  //       ethers.AbiCoder.defaultAbiCoder().encode(
  //         ["bytes4"],
  //         [GENERIC_FALLBACK_SELECTOR as Hex]
  //       ) as Hex
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeTruthy()
  //   }, 60000)

  //   test("uninstall handler module", async () => {
  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = ethers.AbiCoder.defaultAbiCoder().encode(
  //       ["bytes4"],
  //       [GENERIC_FALLBACK_SELECTOR as Hex]
  //     ) as Hex
  //     const userOpReceipt = await smartAccount.uninstallModule(
  //       MOCK_FALLBACK_HANDLER,
  //       ModuleType.Fallback,
  //       deInitData
  //     )

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER,
  //       ethers.AbiCoder.defaultAbiCoder().encode(
  //         ["bytes4"],
  //         [GENERIC_FALLBACK_SELECTOR as Hex]
  //       ) as Hex
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)
})
