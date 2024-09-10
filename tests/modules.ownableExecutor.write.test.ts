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

const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"

describe("modules.ownable.executor.write", () => {
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

  // test.skip("install Ownable Executor", async () => {
  //   let isInstalled = await smartAccount.isModuleInstalled({
  //     type: 'executor',
  //     moduleAddress: OWNABLE_EXECUTOR
  //   })

  //   if (!isInstalled) {
  //     const receipt = await smartAccount.installModule({
  //       moduleAddress: ownableExecutorModule.moduleAddress,
  //       type: ownableExecutorModule.type,
  //       data: ownableExecutorModule.data
  //     })

  // Review: What is the transaction path for invoking executor modules?
  // Note: Also, imo there is no concept of active executor module as such.

  //     smartAccount.setActiveExecutionModule(ownableExecutorModule)

  //     expect(receipt.success).toBe(true)
  //   }
  // }, 60000)

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

  // test.skip("Ownable Executor Module should be installed", async () => {
  //   const isInstalled = await smartAccount.isModuleInstalled({
  //     type: 'executor',
  //     moduleAddress: OWNABLE_EXECUTOR
  //   })
  //   console.log(isInstalled, "isInstalled")
  //   expect(isInstalled).toBeTruthy()
  // }, 60000)

  // test.skip("should add an owner to the module", async () => {
  //   const ownersBefore = await ownableExecutorModule.getOwners()
  //   const isOwnerBefore = ownersBefore.includes(accountTwo.address)

  //   if (isOwnerBefore) {
  //     console.log("Owner already exists in list, skipping test case ...")
  //     return
  //   }

  //   const userOpReceipt = await ownableExecutorModule.addOwner(
  //     accountTwo.address
  //   )

  //   const owners = await ownableExecutorModule.getOwners()
  //   const isOwner = owners.includes(accountTwo.address)

  //   expect(isOwner).toBeTruthy()
  //   expect(userOpReceipt.success).toBeTruthy()
  // }, 60000)

  // test.skip("EOA 2 can execute actions on behalf of SA 1", async () => {
  //   const valueToTransfer = parseEther("0.1")
  //   const recipient = accountTwo.address
  //   const transferEncodedCall = encodeFunctionData({
  //     abi: parseAbi(["function transfer(address to, uint256 value)"]),
  //     functionName: "transfer",
  //     args: [recipient, valueToTransfer]
  //   })

  //   const owners = await ownableExecutorModule.getOwners()
  //   const isOwner = owners.includes(accountTwo.address)
  //   expect(isOwner).toBeTruthy()

  //   const balanceBefore = await smartAccount.getBalances([token])
  //   console.log("balanceBefore", balanceBefore)

  //   const calldata = encodeFunctionData({
  //     abi: parseAbi([
  //       "function executeOnOwnedAccount(address ownedAccount, bytes callData)"
  //     ]),
  //     functionName: "executeOnOwnedAccount",
  //     args: [
  //       await smartAccount.getAddress(),
  //       encodePacked(
  //         ["address", "uint256", "bytes"],
  //         [token, BigInt(Number(0)), transferEncodedCall]
  //       )
  //     ]
  //   })

  //   // EOA 2 (walletClientTwo) executes an action on behalf of SA 1 which is owned by EOA 1 (walletClientOne)
  //   const txHash = await walletClientTwo.sendTransaction({
  //     account: accountTwo, // Called by delegated EOA owner
  //     to: ownableExecutorModule.moduleAddress,
  //     data: calldata,
  //     value: 0n
  //   })

  //   const balanceAfter = await smartAccount.getBalances([token])
  //   console.log("balanceAfter", balanceAfter)

  //   expect(txHash).toBeTruthy()
  // }, 60000)

  // test("SA 2 can execute actions on behalf of SA 1", async () => {
  //   const smartAccount2: NexusSmartAccount = await createSmartAccountClient({
  //     signer: walletClientTwo,
  //     bundlerUrl
  //   })

  //   const valueToTransfer = parseEther("0.1")
  //   const recipient = accountTwo.address
  //   const transferEncodedCall = encodeFunctionData({
  //     abi: parseAbi(["function transfer(address to, uint256 value)"]),
  //     functionName: "transfer",
  //     args: [recipient, valueToTransfer]
  //   })

  //   const transferTransaction = {
  //     to: token,
  //     data: transferEncodedCall,
  //     value: 0n
  //   }

  //   smartAccount2.setActiveExecutionModule(ownableExecutorModule)
  //   const receipt = await smartAccount2.sendTransactionWithExecutor([transferTransaction], await smartAccount.getAddress());
  //   console.log(receipt, "receipt");

  //   expect(receipt.userOpHash).toBeTruthy()
  //   expect(receipt.success).toBe(true)
  // }, 60000)

  // test.skip("SA 2 can execute actions on behalf of SA 1 using module instance instead of smart account instance", async () => {
  //   const smartAccount2: NexusSmartAccount = await createSmartAccountClient({
  //     signer: walletClientTwo,
  //     bundlerUrl
  //   })

  //   const initData = encodePacked(
  //     ["address"],
  //     [await smartAccount2.getAddress()]
  //   )
  //   const ownableExecutorModule2 = await createOwnableExecutorModule(smartAccount2, OWNABLE_EXECUTOR, initData)

  //   // First, we need to install the OwnableExecutor module on SA 2
  //   let isInstalled = await smartAccount2.isModuleInstalled({
  //     type: 'executor',
  //     moduleAddress: OWNABLE_EXECUTOR
  //   })

  //   if (!isInstalled) {
  //     await smartAccount2.installModule({
  //       moduleAddress: ownableExecutorModule2.moduleAddress,
  //       type: ownableExecutorModule2.type,
  //       data: ownableExecutorModule2.data
  //     })
  //   }

  //   smartAccount2.setActiveExecutionModule(ownableExecutorModule)

  //   const valueToTransfer = parseEther("0.1")
  //   const recipient = accountTwo.address
  //   const transferEncodedCall = encodeFunctionData({
  //     abi: parseAbi(["function transfer(address to, uint256 value)"]),
  //     functionName: "transfer",
  //     args: [recipient, valueToTransfer]
  //   })

  //   const owners = await ownableExecutorModule2.getOwners()

  //   // check if SA 2 is as an owner of SA 1
  //   const isOwner = owners.includes(await smartAccount2.getAddress())
  //   if(!isOwner) {
  //     const userOpReceipt = await ownableExecutorModule2.addOwner(
  //       await smartAccount2.getAddress()
  //     )
  //     expect(userOpReceipt.success).toBeTruthy()
  //   }

  //   const transferTransaction = {
  //     target: token as `0x${string}`,
  //     callData: transferEncodedCall,
  //     value: 0n
  //   }

  //   smartAccount2.setActiveExecutionModule(ownableExecutorModule2)
  //   // SA 2 will execute the transferTransaction on behalf of SA 1 (smartAccount)
  //   const receipt = await ownableExecutorModule2.execute(transferTransaction, await smartAccount.getAddress());
  //   console.log(receipt, "receipt");

  //   expect(receipt.userOpHash).toBeTruthy()
  //   expect(receipt.success).toBe(true)
  // }, 60000)

  // test.skip("should remove an owner from the module", async () => {
  //   const userOpReceipt = await ownableExecutorModule.removeOwner(
  //     accountTwo.address
  //   )
  //   const owners = await ownableExecutorModule.getOwners()
  //   const isOwner = owners.includes(accountTwo.address)

  //   expect(isOwner).toBeFalsy()
  //   expect(userOpReceipt.success).toBeTruthy()
  // }, 60000)

  // test.skip("should use rhinestone to call ownable executor", async () => {
  //   const smartAccount2: NexusSmartAccount = await createSmartAccountClient({
  //     signer: walletClientTwo,
  //     bundlerUrl
  //   })

  //   const initData = encodePacked(
  //     ["address"],
  //     [await smartAccount2.getAddress()]
  //   )

  //   const ownableExecutorModule2 = getOwnableExecuter({
  //     owner: await smartAccount2.getAddress(),
  //   });

  //   // First, we need to install the OwnableExecutor module on SA 2
  //   let isInstalled = await smartAccount2.isModuleInstalled({
  //     type: 'executor',
  //     module: OWNABLE_EXECUTOR
  //   })

  //   if (!isInstalled) {
  //     await smartAccount2.installModule({
  //       module: ownableExecutorModule2.module,
  //       type: ownableExecutorModule2.type,
  //       data: ownableExecutorModule2.initData
  //     })
  //   }

  //   smartAccount2.setActiveExecutionModule(ownableExecutorModule)

  //   const valueToTransfer = parseEther("0.1")
  //   const recipient = accountTwo.address
  //   const transferEncodedCall = encodeFunctionData({
  //     abi: parseAbi(["function transfer(address to, uint256 value)"]),
  //     functionName: "transfer",
  //     args: [recipient, valueToTransfer]
  //   })

  //   const transferTransaction = {
  //     target: token as `0x${string}`,
  //     callData: transferEncodedCall,
  //     value: 0n
  //   }

  //   const execution = getExecuteOnOwnedAccountAction({ownedAccount: await smartAccount.getAddress(), execution: transferTransaction})
  //   const receipt = await smartAccount2.sendTransaction([{to: execution.target, data: execution.callData, value: 0n}]);
  //   console.log(receipt, "receipt");

  //   expect(receipt.userOpHash).toBeTruthy()
  // }, 60000)
})
