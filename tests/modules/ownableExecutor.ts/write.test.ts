import {
  http,
  Hex,
  createWalletClient,
  encodeAbiParameters,
  encodePacked,
  parseAbi,
  stringToBytes,
  toHex
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import {
  Module,
  ModuleType,
  OWNABLE_EXECUTOR,
  createOwnableExecutorModule
} from "../../../src"
import {
  SENTINEL_ADDRESS,
  createSmartAccountClient
} from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import type { UserOpReceipt } from "../../../src/bundler"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableExecutor", async () => {
  const nonceOptions = { nonceKey: BigInt(Date.now() + 10) }
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
  const ownableExecutor = "0x858F46775858edB4cE40CE58863dBDf366b7F374"
  const { privateKey } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)

  const [walletClient] = [
    createWalletClient({
      account,
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
    }, 60000)

    test("Ownable Executor Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })
      expect(isInstalled).toBeTruthy()
    }, 60000)

    test("uninstall Ownable Executor Module", async () => {
      const userOpReceipt = await smartAccount.uninstallModule({
        moduleAddress: OWNABLE_EXECUTOR,
        moduleType: ModuleType.Execution
      })

      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })

      expect(userOpReceipt.success).toBe(true)
      expect(isInstalled).toBeFalsy()
      expect(userOpReceipt).toBeTruthy()
    }, 60000)

    test("should add an owner to the module", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Execution,
        moduleAddress: ownableExecutor
      })

      expect(isInstalled).to.be.false

      await smartAccount.installModule({
        moduleAddress: OWNABLE_EXECUTOR,
        moduleType: ModuleType.Execution,
        data: encodePacked(
          ["address"],
          [await smartAccount.getAccountAddress()]
        )
      })

      const userOpReceipt = await ownableExecutorModule.addOwner(
        "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
      )

      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("should remove an owner from the module", async () => {
      const userOpReceipt = await ownableExecutorModule.removeOwner(
        "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
      )
      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("should get all the owners", async () => {
      const owners = await ownableExecutorModule.getOwners()
      console.log(owners, "owners")
    }, 60000)
  })
})
