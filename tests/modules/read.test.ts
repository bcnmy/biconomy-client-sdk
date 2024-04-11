import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import { http, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient
} from "../../src/account"
import {
  createECDSAOwnershipValidationModule,
  createMultiChainValidationModule
} from "../../src/modules"
import { getConfig } from "../utils"

describe("Modules: Read", () => {
  const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl
  } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)
  let [smartAccount, smartAccountTwo]: BiconomySmartAccountV2[] = []

  const [walletClient, walletClientTwo] = [
    createWalletClient({
      account,
      chain,
      transport: http()
    }),
    createWalletClient({
      account: accountTwo,
      chain,
      transport: http()
    })
  ]

  beforeAll(async () => {
    ;[smartAccount, smartAccountTwo] = await Promise.all(
      [walletClient, walletClientTwo].map((client) =>
        createSmartAccountClient({
          chainId,
          signer: client,
          bundlerUrl,
          paymasterUrl
        })
      )
    )
  })

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule with signer",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      // Should not require a signer or chainId
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule,
        signer: walletClient
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      expect(smartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    }
  )

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule without signer",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      // Should not require a signer or chainId
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      expect(smartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    }
  )

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule by default, without explicitly setting it on the smart account",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        signer: walletClient
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      const smartAccountValidationModuleAddress =
        await smartAccount.activeValidationModule.getAddress()
      expect(smartAccountValidationModuleAddress).toEqual(
        defaultValidationModule.moduleAddress
      )
    }
  )

  test.concurrent(
    "should create a MultiChainValidationModule from an ethers signer using convertSigner",
    async () => {
      const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
      const ethersSigner = new Wallet(privateKey, ethersProvider)

      const defaultValidationModule = await createMultiChainValidationModule({
        signer: ethersSigner
      })
      // Should not require a signer or chainId
      const newSmartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule,
        rpcUrl: chain.rpcUrls.default.http[0]
      })

      const address = await newSmartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      // expect the relevant module to be set
      expect(newSmartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    },
    50000
  )

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule from a viem signer using convertSigner",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      // Should not require a signer or chainId
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule,
        rpcUrl: chain.rpcUrls.default.http[0]
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      // expect the relevant module to be set
      expect(smartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    },
    50000
  )
})
