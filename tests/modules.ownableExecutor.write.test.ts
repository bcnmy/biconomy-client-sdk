import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  parseEther,
  encodeFunctionData,
  parseAbi,
  getContract
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
} from "../src/account"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  getTestAccount,
  getTestSmartAccount,
  killNetwork,
  toTestClient,
} from "./src/testUtils"
import type { MasterClient, NetworkConfig } from "./src/testUtils"
import { createK1ValidatorModule, createOwnableExecutorModule, getRandomSigner } from "../src"
import { OwnableExecutorModule } from "../src/modules/executors/OwnableExecutor"
import { K1ValidatorModule } from "../src/modules/validators/K1ValidatorModule"
import { TEST_CONTRACTS } from "./src/callDatas"
import mockAddresses from "./src/__contracts/mockAddresses"
import { MockTokenAbi } from "./src/__contracts/abi/MockTokenAbi"

const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"

describe("modules.ownable.executor.write", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient
  let walletClientTwo: WalletClient

  // Test utils
  let testClient: MasterClient
  let account: Account
  let accountTwo: Account
  let recipientAccount: Account
  let smartAccount: NexusSmartAccount
  let smartAccountTwo: NexusSmartAccount
  let smartAccountAddress: Hex
  let smartAccountAddressTwo: Hex

  let ownableExecutorModule: OwnableExecutorModule
  let k1ValidationModule: K1ValidatorModule

  const OWNABLE_EXECUTOR_MODULE_ADDRESS = TEST_CONTRACTS.OwnableExecutor.address;

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)

    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = getTestAccount(0)
    accountTwo = getTestAccount(1)
    recipientAccount = getTestAccount(3)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    walletClientTwo = createWalletClient({
      account: accountTwo,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, getTestAccount(0))

    smartAccount = await getTestSmartAccount(account, chain, bundlerUrl)

    smartAccountTwo = await getTestSmartAccount(accountTwo, chain, bundlerUrl)

    smartAccountAddress = await smartAccount.getAddress()
    smartAccountAddressTwo = await smartAccountTwo.getAddress()

    ownableExecutorModule = await createOwnableExecutorModule(
      smartAccount,
      OWNABLE_EXECUTOR_MODULE_ADDRESS,
      account.address
    )

    k1ValidationModule = await createK1ValidatorModule(smartAccount.getSigner())
    smartAccount.setActiveValidationModule(k1ValidationModule)

    const tokenContract = getContract({
      address: mockAddresses.MockToken,
      abi: MockTokenAbi,
      client: testClient,
    })

    const balance = await tokenContract.read.balanceOf([
      smartAccountAddress
    ])
    console.log("balance", balance);
    if (balance === 0n) {
      await tokenContract.write.mint([
        smartAccountAddress,
        parseEther("10")
      ])
    }

  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("install Ownable Executor", async () => {
    let isInstalled = await smartAccount.isModuleInstalled({
      type: 'executor',
      moduleAddress: OWNABLE_EXECUTOR_MODULE_ADDRESS
    })

    if (!isInstalled) {
      const response = await smartAccount.installModule(ownableExecutorModule)
      const receipt = await response.wait()

      expect(receipt.success).toBe(true)
    }
  }, 60000)

  test.concurrent.skip("uninstall Ownable Executor", async () => {
    let isInstalled = await smartAccount.isModuleInstalled({
      type: 'executor',
      moduleAddress: OWNABLE_EXECUTOR_MODULE_ADDRESS
    })

    if (isInstalled) {
      const response = await smartAccount.uninstallModule({
        moduleAddress: ownableExecutorModule.moduleAddress,
        type: ownableExecutorModule.type,
        data: ownableExecutorModule.data
      })
      const receipt = await response.wait()
      expect(receipt.success).toBe(true)
    }
  }, 60000)

  test("Ownable Executor Module should be installed", async () => {
    const isInstalled = await smartAccount.isModuleInstalled({
      type: 'executor',
      moduleAddress: OWNABLE_EXECUTOR_MODULE_ADDRESS
    })
    expect(isInstalled).toBeTruthy()
  }, 60000)

  test("should add owner to the module", async () => {
    const addOwnerUserOp = await ownableExecutorModule.addOwnerUserOp(
      smartAccountAddressTwo
    )
    const addOwnerResponse = await smartAccount.sendUserOp(addOwnerUserOp)
    const addOwnerReceipt = await addOwnerResponse.wait()

    expect(addOwnerReceipt.success).toBeTruthy()

    // Verify the owner was removed
    const ownersAfter = await ownableExecutorModule.getOwners()
    const isOwnerAfter = ownersAfter.includes(smartAccountAddressTwo)
    expect(isOwnerAfter).toBeTruthy()
  }, 60000)

  test("another owner can execute actions on behalf of smart account one", async () => {
    // If SA 2 is not added as an owner of SA 1, add it as an owner
    const owners = await ownableExecutorModule.getOwners()
    const isOwner = owners.includes(smartAccountAddressTwo)
    if (!isOwner) {
      const userOp = await ownableExecutorModule.addOwnerUserOp(smartAccountAddressTwo)
      const response = await smartAccount.sendUserOp(userOp)
      const receipt = await response.wait()
      expect(receipt.success).toBeTruthy()
    }

    const valueToTransfer = parseEther("0.1")
    const recipient = accountTwo.address
    const token: Hex = mockAddresses.MockToken
    const transferEncodedCall = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 value)"]),
      functionName: "transfer",
      args: [recipient, valueToTransfer]
    })

    const transferTransaction = {
      target: token,
      callData: transferEncodedCall,
      value: 0n
    }

    const userop = await ownableExecutorModule.getExecuteUserOp(transferTransaction, smartAccountTwo);

    const response = await smartAccountTwo.sendUserOp(userop)
    const receipt = await response.wait()

    expect(receipt.userOpHash).toBeTruthy()
    expect(receipt.success).toBe(true)
  }, 60000)

  test("another owner can execute batch of actions on behalf of smart account one", async () => {
    // If SA 2 is not added as an owner of SA 1, add it as an owner
    const owners = await ownableExecutorModule.getOwners()
    const isOwner = owners.includes(smartAccountAddressTwo)
    if (!isOwner) {
      const userOp = await ownableExecutorModule.addOwnerUserOp(smartAccountAddressTwo)
      const response = await smartAccount.sendUserOp(userOp)
      const receipt = await response.wait()
      expect(receipt.success).toBeTruthy()
    }

    const valueToTransfer = parseEther("0.1")
    const recipient = accountTwo.address
    const token: Hex = mockAddresses.MockToken
    const transferEncodedCall = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 value)"]),
      functionName: "transfer",
      args: [recipient, valueToTransfer]
    })

    const transferTransaction = {
      target: token,
      callData: transferEncodedCall,
      value: 0n
    }

    const userop = await ownableExecutorModule.getExecuteUserOp([transferTransaction, transferTransaction], smartAccountTwo);

    const response = await smartAccountTwo.sendUserOp(userop)
    const receipt = await response.wait()

    expect(receipt.userOpHash).toBeTruthy()
    expect(receipt.success).toBe(true)
  }, 60000)

  test("should remove owner from the module", async () => {
    const removeOwnerUserOp = await ownableExecutorModule.removeOwnerUserOp(
      smartAccountAddressTwo
    )
    const removeOwnerResponse = await smartAccount.sendUserOp(removeOwnerUserOp)
    const removeOwnerReceipt = await removeOwnerResponse.wait()

    expect(removeOwnerReceipt.success).toBeTruthy()

    // Verify the owner was removed
    const ownersAfterRemove = await ownableExecutorModule.getOwners()
    const isOwnerAfterRemove = ownersAfterRemove.includes(smartAccountAddressTwo)
    expect(isOwnerAfterRemove).toBeFalsy()
  }, 60000)
})
