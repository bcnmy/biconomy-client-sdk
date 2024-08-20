import {
  http,
  createWalletClient,
  encodeFunctionData,
  encodePacked,
  parseAbi,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { describe, expect, test } from "vitest"
import {
  OWNABLE_EXECUTOR,
  createOwnableExecutorModule
} from "../../../src"
import { createSmartAccountClient } from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableExecutor", async () => {
  const token = "0xfA5E6d39e46328961d625f6334726F057c94812A"
  const { privateKey, privateKeyTwo, bundlerUrl } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

  const [walletClient, walletClientTwo] = [
    createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    }),
    createWalletClient({
      account: accountTwo,
      chain: baseSepolia,
      transport: http()
    })
  ]

  const smartAccount: NexusSmartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl
  })

  const ownableExecutorModule = await createOwnableExecutorModule(smartAccount)

  describe("Ownable Executor Module Tests", async () => {
    test.skip("install Ownable Executor", async () => {
      let isInstalled = await smartAccount.isModuleInstalled({
        type: 'executor',
        module: OWNABLE_EXECUTOR
      })

      if (!isInstalled) {
        const receipt = await smartAccount.installModule({
          module: OWNABLE_EXECUTOR,
          type: 'executor',
          data: encodePacked(
            ["address"],
            [await smartAccount.getAddress()]
          )
        })

        smartAccount.setActiveExecutionModule(ownableExecutorModule)

        expect(receipt.success).toBe(true)
      }
    }, 60000)

    test.skip("Ownable Executor Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        type: 'executor',
        module: OWNABLE_EXECUTOR
      })
      console.log(isInstalled, "isInstalled")
      expect(isInstalled).toBeTruthy()
    }, 60000)

    test.skip("should add an owner to the module", async () => {
      const ownersBefore = await ownableExecutorModule.getOwners()
      const isOwnerBefore = ownersBefore.includes(accountTwo.address)

      if (isOwnerBefore) {
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

    test.skip("EOA 2 can execute actions on behalf of SA 1", async () => {
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
      console.log("balanceBefore", balanceBefore)

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
        value: 0n
      })

      const balanceAfter = await smartAccount.getBalances([token])
      console.log("balanceAfter", balanceAfter)

      expect(txHash).toBeTruthy()
    }, 60000)

    test.skip("SA 2 can execute actions on behalf of SA 1", async () => {

      const smartAccount2: NexusSmartAccount = await createSmartAccountClient({
        signer: walletClientTwo,
        bundlerUrl
      })

      const ownableExecutorModule2 = await createOwnableExecutorModule(smartAccount2)

      // First, we need to install the OwnableExecutor module on SA 2
      let isInstalled = await smartAccount2.isModuleInstalled({
        type: 'executor',
        module: OWNABLE_EXECUTOR
      })

      if (!isInstalled) {
        await smartAccount2.installModule({
          module: OWNABLE_EXECUTOR,
          type: 'executor',
          data: encodePacked(
            ["address"],
            [await smartAccount2.getAddress()]
          )
        })
      }

      smartAccount2.setActiveExecutionModule(ownableExecutorModule)

      const valueToTransfer = parseEther("0.1")
      const recipient = accountTwo.address
      const transferEncodedCall = encodeFunctionData({
        abi: parseAbi(["function transfer(address to, uint256 value)"]),
        functionName: "transfer",
        args: [recipient, valueToTransfer]
      })

      const owners = await ownableExecutorModule2.getOwners()
      
      // check if SA 2 is as an owner of SA 1
      const isOwner = owners.includes(await smartAccount2.getAddress())
      if(!isOwner) {
        const userOpReceipt = await ownableExecutorModule2.addOwner(
          await smartAccount2.getAddress()
        )
        expect(userOpReceipt.success).toBeTruthy()
      }

      const transferTransaction = {
        to: token,
        data: transferEncodedCall,
        value: 0n
      }

      smartAccount2.setActiveExecutionModule(ownableExecutorModule2)
      // SA 2 will execute the transferTransaction on behalf of SA 1 (smartAccount)
      const receipt = await smartAccount2.sendTransactionWithExecutor([transferTransaction], await smartAccount.getAddress());
      console.log(receipt, "receipt");

      expect(receipt.userOpHash).toBeTruthy()
      expect(receipt.success).toBe(true)
    }, 60000)

    test("SA 2 can execute actions on behalf of SA 1 using module instance instead of smart account instance", async () => {
      const smartAccount2: NexusSmartAccount = await createSmartAccountClient({
        signer: walletClientTwo,
        bundlerUrl
      })

      const initData = encodePacked(
        ["address"],
        [await smartAccount2.getAddress()]
      )
      const ownableExecutorModule2 = await createOwnableExecutorModule(smartAccount2, initData)

      // First, we need to install the OwnableExecutor module on SA 2
      let isInstalled = await smartAccount2.isModuleInstalled({
        type: 'executor',
        module: OWNABLE_EXECUTOR
      })

      if (!isInstalled) {
        await smartAccount2.installModule({
          module: ownableExecutorModule2.moduleAddress,
          type: ownableExecutorModule2.type,
          data: ownableExecutorModule2.data
        })
      }

      smartAccount2.setActiveExecutionModule(ownableExecutorModule)

      const valueToTransfer = parseEther("0.1")
      const recipient = accountTwo.address
      const transferEncodedCall = encodeFunctionData({
        abi: parseAbi(["function transfer(address to, uint256 value)"]),
        functionName: "transfer",
        args: [recipient, valueToTransfer]
      })

      const owners = await ownableExecutorModule2.getOwners()
      
      // check if SA 2 is as an owner of SA 1
      const isOwner = owners.includes(await smartAccount2.getAddress())
      if(!isOwner) {
        const userOpReceipt = await ownableExecutorModule2.addOwner(
          await smartAccount2.getAddress()
        )
        expect(userOpReceipt.success).toBeTruthy()
      }

      const transferTransaction = {
        target: token as `0x${string}`,
        callData: transferEncodedCall,
        value: 0n
      }

      smartAccount2.setActiveExecutionModule(ownableExecutorModule2)
      // SA 2 will execute the transferTransaction on behalf of SA 1 (smartAccount)
      const receipt = await ownableExecutorModule2.execute(transferTransaction, await smartAccount.getAddress());
      console.log(receipt, "receipt");

      expect(receipt.userOpHash).toBeTruthy()
      expect(receipt.success).toBe(true)
    }, 60000)

    test.skip("should remove an owner from the module", async () => {
      const userOpReceipt = await ownableExecutorModule.removeOwner(
        accountTwo.address
      )
      const owners = await ownableExecutorModule.getOwners()
      const isOwner = owners.includes(accountTwo.address)

      expect(isOwner).toBeFalsy()
      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

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
})
