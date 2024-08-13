import { http, createWalletClient, encodeAbiParameters } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { afterEach, describe, expect, test } from "vitest"
import {
  Module,
  ModuleType,
  OWNABLE_VALIDATOR,
  createOwnableValidatorModule
} from "../../../../src"
import { createSmartAccountClient } from "../../../../src/account"
import type { NexusSmartAccount } from "../../../../src/account/NexusSmartAccount"
import type { UserOpReceipt } from "../../../../src/bundler"
import { getConfig } from "../../../utils"

describe("Account:Modules:OwnableValidator", async () => {
  const nonceOptions = { nonceKey: BigInt(Date.now() + 10) }
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
  const { privateKey, privateKeyTwo, bundlerUrl } = getConfig()
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
    bundlerUrl
  })

  const owners = [walletClient.account.address, accountTwo.address]

  const ownableValidatorModule = await createOwnableValidatorModule(
    smartAccount,
    1,
    owners
  )

  describe("Ownable Validator Module Tests", async () => {
    test("install Ownable Validator with 1 owner", async () => {
      const isInstalledBefore = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Validation,
        moduleAddress: OWNABLE_VALIDATOR
      })

      const threshold = 1
      const installData = encodeAbiParameters(
        [
          { name: "threshold", type: "uint256" },
          { name: "owners", type: "address[]" }
        ],
        [BigInt(threshold), [walletClient.account.address]]
      )

      // 866077811418299683029716658306608038086113973150706820694579085353n
      // 866077811418299683029716658306608038086113973150706820694579085354n
      console.log(isInstalledBefore, "isInstalledBefore")

      if (!isInstalledBefore) {
        const userOpReceipt: UserOpReceipt = await smartAccount.installModule({
          moduleAddress: OWNABLE_VALIDATOR,
          moduleType: ModuleType.Validation,
          data: installData
        })

        const isInstalled = await smartAccount.isModuleInstalled({
          moduleType: ModuleType.Validation,
          moduleAddress: OWNABLE_VALIDATOR
        })

        smartAccount.setActiveValidationModule(ownableValidatorModule)

        expect(userOpReceipt.success).toBe(true)
        expect(isInstalled).toBeTruthy()
      }
    }, 60000)

    test("Ownable Validator Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        moduleType: ModuleType.Validation,
        moduleAddress: OWNABLE_VALIDATOR
      })
      expect(isInstalled).toBeTruthy()
    }, 60000)

    // test("should add an owner to the module", async () => {
    //   const owners = await ownableValidatorModule.getOwners()
    //   if(owners.includes("0x4D8249d21c9553b1bD23cABF611011376dd3416a")) {
    //     console.log("Owner already exists in list, skipping test case ...")
    //     return
    //   }
    //   const userOpReceipt = await ownableValidatorModule.addOwner(
    //     "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
    //   )
    //   expect(userOpReceipt.success).toBeTruthy()
    // }, 60000)

    // test("should remove an owner from the module", async () => {
    //   const ownersBefore = await ownableValidatorModule.getOwners();
    //   console.log(ownersBefore, "ownersBefore");
    //   const userOpReceipt = await ownableValidatorModule.removeOwner(
    //     "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
    //   )
    //   const ownersAfter = await ownableValidatorModule.getOwners();
    //   console.log(ownersAfter, "ownersAfter");
    //   expect(userOpReceipt.success).toBeTruthy()
    // }, 60000)

    // test("should get all the owners", async () => {
    //   const owners = await ownableValidatorModule.getOwners()
    //   console.log(owners, "owners")
    // }, 60000)
  })
})
