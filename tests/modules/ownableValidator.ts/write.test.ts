import { http, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { describe, expect, test } from "vitest"
import {
  ModuleName,
  ModuleType,
  OWNABLE_VALIDATOR,
  createOwnableValidatorModule
} from "../../../src"
import { createSmartAccountClient } from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import type { UserOpReceipt } from "../../../src/bundler"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableValidator", async () => {
  const nonceOptions = { nonceKey: BigInt(Date.now() + 10) }
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
  const { privateKey, privateKeyTwo } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

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

  const owners = [walletClient.account.address, accountTwo.address]

  const ownableValidatorModule = await createOwnableValidatorModule(
    smartAccount,
    2,
    owners
  )
  smartAccount.setActiveValidationModule(ownableValidatorModule)

  describe("Ownable Validator Module Tests", async () => {
    test("install Ownable Executor", async () => {
      const isInstalledBefore = await smartAccount.isModuleInstalled(
        ModuleType.Validation,
        OWNABLE_VALIDATOR
      )

      if (!isInstalledBefore) {
        const userOpReceipt: UserOpReceipt = await smartAccount.installModule(
          ModuleName.OwnableValidator
        )

        const isInstalled = await smartAccount.isModuleInstalled(
          ModuleType.Validation,
          OWNABLE_VALIDATOR
        )

        expect(userOpReceipt.success).toBe(true)
        expect(isInstalled).toBeTruthy()
      }
    }, 60000)

    test("Ownable Validator Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled(
        ModuleType.Validation,
        OWNABLE_VALIDATOR
      )
      expect(isInstalled).toBeTruthy()
    }, 60000)

    test("uninstall Ownable Validator Module", async () => {
      const userOpReceipt = await smartAccount.uninstallModule(
        ModuleName.OwnableValidator
      )

      const isInstalled = await smartAccount.isModuleInstalled(
        ModuleType.Validation,
        OWNABLE_VALIDATOR
      )

      expect(userOpReceipt.success).toBe(true)
      expect(isInstalled).toBeFalsy()
      expect(userOpReceipt).toBeTruthy()
    }, 60000)

    test("should add an owner to the module", async () => {
      const userOpReceipt = await ownableValidatorModule.addOwner(
        "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
      )

      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("should remove an owner from the module", async () => {
      const userOpReceipt = await ownableValidatorModule.removeOwner(
        "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
      )
      expect(userOpReceipt.success).toBeTruthy()
    }, 60000)

    test("should get all the owners", async () => {
      const owners = await ownableValidatorModule.getOwners()
      console.log(owners, "owners")
    }, 60000)
  })
})
