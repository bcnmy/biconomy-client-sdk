import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  parseEther,
  encodePacked,
  encodeFunctionData,
  parseAbi
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
import { createK1ValidatorModule, createOwnableExecutorModule } from "../src"
import { OwnableExecutorModule } from "../src/modules/executors/OwnableExecutor"
import { K1ValidatorModule } from "../src/modules/validators/K1ValidatorModule"
import { waitForTransactionReceipt } from "viem/actions"

const NETWORK_TYPE: TestFileNetworkType = "PUBLIC_TESTNET"

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

  const OWNABLE_EXECUTOR_MODULE_ADDRESS = "0x989110e958902f619148b8171fbDF1Dca0c5AE0B";

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)

    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = getTestAccount(5)
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

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain
    })

    smartAccountTwo = await createSmartAccountClient({
      signer: walletClientTwo,
      bundlerUrl,
      chain
    })

    smartAccountAddress = await smartAccount.getAddress()
    smartAccountAddressTwo = await smartAccountTwo.getAddress()

    ownableExecutorModule = await createOwnableExecutorModule(
      smartAccount,
      OWNABLE_EXECUTOR_MODULE_ADDRESS,
      account.address
    )

    k1ValidationModule = await createK1ValidatorModule(smartAccount.getSigner(), encodePacked(["address"], [account.address]))
    const isDeployed = await smartAccount.isAccountDeployed();
    const installedValidators = await smartAccount.getInstalledValidators();
    const isInstalled = await smartAccount.isModuleInstalled(k1ValidationModule);
    smartAccount.setActiveValidationModule(k1ValidationModule)
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should install k1 validator", async () => {
    const isInstalled = await smartAccount.isModuleInstalled({
      type: 'validator',
      moduleAddress: k1ValidationModule.moduleAddress,
      data: encodePacked(["address"], [account.address])
    })
    if (!isInstalled) {
      const response = await smartAccount.installModule(k1ValidationModule)
      const receipt = await response.wait()
      smartAccount.setActiveValidationModule(k1ValidationModule)
      expect(receipt.success).toBe(true)
    }
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

  // test.skip("uninstall Ownable Executor", async () => {
  //   const smartAccount2: NexusSmartAccount = await createSmartAccountClient({
  //     signer: walletClientTwo,
  //     bundlerUrl
  //   })

  //   const ownableExecutorModule2 = await createOwnableExecutorModule(smartAccount2, OWNABLE_EXECUTOR)

  //   let isInstalled = await smartAccount2.isModuleInstalled({
  //     type: 'executor',
  //     moduleAddress: OWNABLE_EXECUTOR
  //   })

  //   if (isInstalled) {
  //     await smartAccount2.uninstallModule({
  //       moduleAddress: ownableExecutorModule2.moduleAddress,
  //       type: ownableExecutorModule2.type,
  //       data: ownableExecutorModule2.data
  //     })
  //   }

  // }, 60000)

  test("Ownable Executor Module should be installed", async () => {
    const isInstalled = await smartAccount.isModuleInstalled({
      type: 'executor',
      moduleAddress: OWNABLE_EXECUTOR_MODULE_ADDRESS
    })
    expect(isInstalled).toBeTruthy()
  }, 60000)

  test("should add an owner to the module", async () => {
    const ownersBefore = await ownableExecutorModule.getOwners()
    const isOwnerBefore = ownersBefore.includes(accountTwo.address)

    if (isOwnerBefore) {
      console.log("Owner already exists in list, skipping test case ...")
      return
    }

    const userop = await ownableExecutorModule.addOwnerUserOp(
      accountTwo.address
    )
    const response = await smartAccount.sendUserOp(userop)
    const receipt = await response.wait()

    const owners = await ownableExecutorModule.getOwners()
    const isOwner = owners.includes(accountTwo.address)

    expect(isOwner).toBeTruthy()
    expect(receipt.success).toBeTruthy()
  }, 60000)

  test.skip("EOA 2 can execute actions on behalf of SA 1", async () => {
    const valueToTransfer = parseEther("0.1")
    const token = "0x32bC432524DAcd05a2f5Ae7F08781385bfFe6ECE" // base sepolia address
    const recipient = accountTwo.address
    const transferEncodedCall = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 value)"]),
      functionName: "transfer",
      args: [recipient, valueToTransfer]
    })

    const owners = await ownableExecutorModule.getOwners()
    const isOwner = owners.includes(accountTwo.address)
    expect(isOwner).toBeTruthy()

    const balanceBefore = await smartAccount.getBalances([token])

    const calldata = encodeFunctionData({
      abi: parseAbi([
        "function executeOnOwnedAccount(address ownedAccount, bytes callData)"
      ]),
      functionName: "executeOnOwnedAccount",
      args: [
        await smartAccount.getAddress(),
        encodePacked(
          ["address", "uint256", "bytes"],
          [token, BigInt(Number(0)), transferEncodedCall]
        )
      ]
    })

    // EOA 2 (walletClientTwo) executes an action on behalf of SA 1 which is owned by EOA 1 (walletClientOne)
    const txHash = await walletClientTwo.sendTransaction({
      account: accountTwo, // Called by delegated EOA owner
      to: ownableExecutorModule.moduleAddress,
      data: calldata,
      value: 0n,
      chain
    })

    const receipt = await waitForTransactionReceipt(walletClientTwo, { hash: txHash })
    expect(receipt.status).toBe("success")

    const balanceAfter = await smartAccount.getBalances([token])
    expect(balanceAfter[0].amount).toBeLessThan(balanceBefore[0].amount)

    expect(txHash).toBeTruthy()
  }, 60000)

  test("SA 2 can execute actions on behalf of SA 1", async () => {
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
    const token: Hex = "0x32bC432524DAcd05a2f5Ae7F08781385bfFe6ECE" // base sepolia address
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

  test("SA 2 can execute batch of actions on behalf of SA 1", async () => {
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
    const token: Hex = "0x32bC432524DAcd05a2f5Ae7F08781385bfFe6ECE" // base sepolia address
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
})
