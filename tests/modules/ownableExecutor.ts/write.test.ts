import {
  http,
  createWalletClient,
  encodeFunctionData,
  encodePacked,
  parseAbi,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { describe, expect, test } from "vitest"
import {
  ModuleType,
  OWNABLE_EXECUTOR,
  createOwnableExecutorModule
} from "../../../src"
import { createSmartAccountClient } from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableExecutor", async () => {
  const token = "0x5a80620D47e4b786C4eC070837cb712486FEE857"
  const { privateKey, privateKeyTwo, bundlerUrl } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

  const [walletClient, walletClientTwo] = [
    createWalletClient({
      account,
      chain: sepolia,
      transport: http()
    }),
    createWalletClient({
      account: accountTwo,
      chain: sepolia,
      transport: http()
    })
  ]

  const smartAccount: NexusSmartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl
  })

  const ownableExecutorModule = await createOwnableExecutorModule(smartAccount)

  describe("Ownable Executor Module Tests", async () => {
    // test("install Ownable Executor", async () => {
    //   let isInstalled = await smartAccount.isModuleInstalled({
    //     moduleType: ModuleType.Execution,
    //     moduleAddress: OWNABLE_EXECUTOR
    //   })

    //   console.log("init data", encodePacked(
    //     ["address"],
    //     [await smartAccount.getAddress()]
    //   ));
      
    //   if (!isInstalled) {
    //     const receipt = await smartAccount.installModule({
    //       moduleAddress: OWNABLE_EXECUTOR,
    //       moduleType: ModuleType.Execution,
    //       data: encodePacked(
    //         ["address"],
    //         [await smartAccount.getAddress()]
    //       )
    //     })

    //     isInstalled = await smartAccount.isModuleInstalled({
    //       moduleType: ModuleType.Execution,
    //       moduleAddress: OWNABLE_EXECUTOR
    //     })

    //     smartAccount.setActiveExecutionModule(ownableExecutorModule)

    //     expect(receipt.success).toBe(true)
    //     expect(isInstalled).toBeTruthy()
    //   }
    //   expect(isInstalled).toBeTruthy()
    // }, 60000)

    test("Ownable Executor Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: OWNABLE_EXECUTOR
      })
      console.log(isInstalled, "isInstalled");
      expect(isInstalled).toBeTruthy()
    }, 60000)

    // test("uninstall Ownable Executor Module", async () => {
    //   let isInstalled = await smartAccount.isModuleInstalled({
    //     moduleType: ModuleType.Execution,
    //     moduleAddress: OWNABLE_EXECUTOR
    //   })

    //   if (isInstalled) {
    //     const userOpReceipt = await smartAccount.uninstallModule({
    //       moduleAddress: OWNABLE_EXECUTOR,
    //       moduleType: ModuleType.Execution
    //     })

    //     isInstalled = await smartAccount.isModuleInstalled({
    //       moduleType: ModuleType.Execution,
    //       moduleAddress: OWNABLE_EXECUTOR
    //     })

    //     expect(userOpReceipt.success).toBe(true)
    //     expect(isInstalled).toBeFalsy()
    //     expect(userOpReceipt).toBeTruthy()
    //   }
    //   expect(isInstalled).toBeFalsy()
    // }, 60000)

    test("should add an owner to the module", async () => {
      let isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: OWNABLE_EXECUTOR
      })

      // if (!isInstalled) {
      //   await smartAccount.installModule({
      //     moduleAddress: OWNABLE_EXECUTOR,
      //     moduleType: ModuleType.Execution,
      //     data: encodePacked(
      //       ["address"],
      //       [await smartAccount.getAccountAddress()]
      //     )
      //   })
      // }

      isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: OWNABLE_EXECUTOR
      })

      expect(isInstalled).to.be.true

      const ownersBefore = await ownableExecutorModule.getOwners()
      const isOwnerBefore = ownersBefore.includes(accountTwo.address)

      if(isOwnerBefore) {
        console.log("Owner already exists in list, skipping test case ...")
        return
      }

      const userOpReceipt = await ownableExecutorModule.addOwner(
        accountTwo.address
      )

      const owners = await ownableExecutorModule.getOwners()
      const isOwner = owners.includes(accountTwo.address)

      expect(isOwner).toBeTruthy()
      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("delegated owner transfers tokens from smart account", async () => {
      const valueToTransfer = parseEther("0.1")
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
      console.log("balanceBefore", balanceBefore);

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

      const txHash = await walletClientTwo.sendTransaction({
        account: accountTwo, // Called by delegated owner
        to: ownableExecutorModule.moduleAddress,
        data: calldata,
        value: 0n
      })

      const balanceAfter = await smartAccount.getBalances([token])
      console.log("balanceAfter", balanceAfter);

      console.log("txHash", txHash);
      expect(txHash).toBeTruthy()
    }, 60000)

    // test("should remove an owner from the module", async () => {
    //   const userOpReceipt = await ownableExecutorModule.removeOwner(
    //     accountTwo.address
    //   )
    //   const owners = await ownableExecutorModule.getOwners()
    //   const isOwner = owners.includes(accountTwo.address)

    //   expect(isOwner).toBeFalsy()
    //   expect(userOpReceipt.success).toBeTruthy()
    // }, 60000)
  })
})
