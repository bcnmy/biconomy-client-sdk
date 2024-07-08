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
  ModuleType,
  OWNABLE_EXECUTOR,
  createOwnableExecutorModule
} from "../../../src"
import { createSmartAccountClient } from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import type { UserOpReceipt } from "../../../src/bundler"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableExecutor", async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0xECF8B93B9b56F9105C329381C573E42640a27A73"
  const ownableExecutor = "0x858F46775858edB4cE40CE58863dBDf366b7F374"
  const { privateKey, privateKeyTwo } = getConfig()
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
    bundlerUrl:
      "https://api.pimlico.io/v2/84532/rpc?apikey=22c48af7-4886-4c7d-8d4c-5d50262a23f3"
  })

  const ownableExecutorModule = await createOwnableExecutorModule(smartAccount)
  await smartAccount.setActiveExecutorModule(ownableExecutorModule)

  describe("Ownable Executor Module Tests", async () => {
    test("install Ownable Executor", async () => {
      const signerAddress = await smartAccount.getSigner().getAddress()
      console.log(signerAddress, "signerAddress from tests")

      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })

      if (!isInstalled) {
        const userOpReceipt: UserOpReceipt = await smartAccount.installModule({
          moduleAddress: OWNABLE_EXECUTOR,
          moduleType: ModuleType.Execution,
          data: encodePacked(
            ["address"],
            [await smartAccount.getAccountAddress()]
          )
        })

        expect(userOpReceipt.success).toBe(true)
        expect(isInstalled).toBeTruthy()
      }
      expect(isInstalled).toBeTruthy()
    }, 60000)

    test("Ownable Executor Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })
      expect(isInstalled).toBeTruthy()
    }, 60000)

    test("uninstall Ownable Executor Module", async () => {
      let isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })

      if (isInstalled) {
        const userOpReceipt = await smartAccount.uninstallModule({
          moduleAddress: OWNABLE_EXECUTOR,
          moduleType: ModuleType.Execution
        })

        isInstalled = await smartAccount.isModuleInstalled({
          moduleType: ModuleType.Execution,
          moduleAddress: ownableExecutor
        })

        expect(userOpReceipt.success).toBe(true)
        expect(isInstalled).toBeFalsy()
        expect(userOpReceipt).toBeTruthy()
      }
      expect(isInstalled).toBeFalsy()
    }, 60000)

    test("should add an owner to the module", async () => {
      let isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })

      if (!isInstalled) {
        await smartAccount.installModule({
          moduleAddress: OWNABLE_EXECUTOR,
          moduleType: ModuleType.Execution,
          data: encodePacked(
            ["address"],
            [await smartAccount.getAccountAddress()]
          )
        })
      }

      isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })

      expect(isInstalled).to.be.true

      const userOpReceipt = await ownableExecutorModule.addOwner(
        accountTwo.address
      )

      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("should remove an owner from the module", async () => {
      const userOpReceipt = await ownableExecutorModule.removeOwner(
        accountTwo.address
      )
      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("should get all the owners", async () => {
      const owners = await ownableExecutorModule.getOwners()
      console.log(owners, "owners")
    }, 60000)

    test("added owner executes token transfer on Smart Account", async () => {
      const valueToTransfer = parseEther("0.1")
      const recipient = accountTwo.address
      const transferEncodedCall = encodeFunctionData({
        abi: parseAbi(["function transfer(address to, uint256 value)"]),
        functionName: "transfer",
        args: [recipient, valueToTransfer]
      })

      await ownableExecutorModule.addOwner(accountTwo.address)

      const owners = await ownableExecutorModule.getOwners()
      const isOwner = owners.includes(accountTwo.address)
      expect(isOwner).toBeTruthy()

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
        account: accountTwo, // Called by second owner
        to: ownableExecutorModule.moduleAddress,
        data: calldata,
        value: 0n
      })

      expect(txHash).toBeTruthy()
    }, 60000)
  })
})
