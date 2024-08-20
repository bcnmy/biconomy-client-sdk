import {
  http,
  createWalletClient,
  encodePacked,
  encodeFunctionData,
  parseAbi
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { afterEach, describe, expect, test } from "vitest"
import {
  K1_VALIDATOR,
  Module,
  ModuleType,
  OWNABLE_VALIDATOR,
  createK1ValidatorModule,
  getRandomSigner,
  moduleTypeIds,
} from "../../../src"
import { createSmartAccountClient } from "../../../src/account"
import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
import type { UserOpReceipt } from "../../../src/bundler"
import { getConfig } from "../../utils"

describe("Account:Modules:OwnableValidator", async () => {
  const { privateKey, privateKeyTwo, bundlerUrl } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"

  const [walletClient] = [
    createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    })
  ]

  const smartAccount: NexusSmartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl,
  })

  const k1ValidationModule = await createK1ValidatorModule(
    smartAccount.getSigner()
  )

  smartAccount.setActiveValidationModule(k1ValidationModule);

  describe("K1 Validator Module Tests", async () => {
    test("install k1 Validator with 1 owner", async () => {
      const isInstalledBefore = await smartAccount.isModuleInstalled({
        type: 'validator',
        moduleAddress: K1_VALIDATOR
      })

      console.log(isInstalledBefore, "isInstalledBefore")

      if (!isInstalledBefore) {
        const userOpReceipt: UserOpReceipt = await smartAccount.installModule({
          moduleAddress: K1_VALIDATOR,
          type: 'validator',
          data: encodePacked(["address"], [await smartAccount.getAddress()])
        })

        await smartAccount.uninstallModule({
          moduleAddress: K1_VALIDATOR,
          type: 'validator',
          data: encodePacked(["address"], [await smartAccount.getAddress()])
        })

        smartAccount.setActiveValidationModule(k1ValidationModule)

        expect(userOpReceipt.success).toBe(true)
      }
    }, 60000)

    test("Ownable Validator Module should be installed", async () => {
      const isInstalled = await smartAccount.isModuleInstalled({
        type: 'validator',
        moduleAddress: OWNABLE_VALIDATOR
      })
      expect(isInstalled).toBeTruthy()
    }, 60000)

    test("Mint an NFT using K1Validator as Validation Module", async () => {
      const randomAccount = getRandomSigner();
      
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [randomAccount.pbKey]
      })

      const transaction = {
        to: nftAddress, 
        data: encodedCall
      }

      const response = await smartAccount.sendTransaction([transaction])
      console.log(response, "response")

      const receipt = await response.wait()
      console.log(receipt, "receipt")

      expect(receipt.success).toBe(true)
    }, 60000)
  })
})
