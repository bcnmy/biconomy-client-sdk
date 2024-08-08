import { http, createWalletClient, encodeAbiParameters, encodePacked } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { afterEach, describe, expect, test } from "vitest"
import {
    K1_VALIDATOR,
  Module,
  ModuleType,
  OWNABLE_VALIDATOR,
  createK1ValidatorModule,
  createOwnableValidatorModule
} from "../../../src"
import { createSmartAccountClient } from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import type { UserOpReceipt } from "../../../src/bundler"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableValidator", async () => {
  const { privateKey, privateKeyTwo, bundlerUrl } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

  const [walletClient] = [
    createWalletClient({
      account,
      chain: sepolia,
      transport: http()
    })
  ]

  const smartAccount: NexusSmartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl
  })

  const owners = [walletClient.account.address, accountTwo.address]

  const k1ValidationModule = await createK1ValidatorModule(
    smartAccount.getSigner()
  )
  
  describe("K1 Validator Module Tests", async () => {
    test("install k1 Validator with 1 owner", async () => {
      const isInstalledBefore = await smartAccount.isModuleInstalled(
        {
            moduleType: ModuleType.Validation,
            moduleAddress: K1_VALIDATOR
        }
      )

      console.log(isInstalledBefore, "isInstalledBefore");

      if (!isInstalledBefore) {
        const userOpReceipt: UserOpReceipt = await smartAccount.installModule(
          {
            moduleAddress: K1_VALIDATOR,
            moduleType: ModuleType.Validation,
            data: encodePacked(['address'], [await smartAccount.getAddress()])
          }
        )

        // const isInstalled = await smartAccount.isModuleInstalled(
        //   {
        //     moduleType: ModuleType.Validation,
        //     moduleAddress: K1_VALIDATOR
        //   }
        // )

        smartAccount.setActiveValidationModule(k1ValidationModule)

        expect(userOpReceipt.success).toBe(true)
        // expect(isInstalled).toBeTruthy()
      }
    }, 60000)

    test("Ownable Validator Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled(
        {
            moduleType: ModuleType.Validation,
            moduleAddress: OWNABLE_VALIDATOR
        }
      )
      expect(isInstalled).toBeTruthy()
    }, 60000)
  })
})
