import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import type { PublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { DEFAULT_ECDSA_OWNERSHIP_MODULE } from "../../../src/accounts/utils/constants.js"
import { walletClientToSmartAccountSigner } from "../../../src/accounts/utils/helpers.js"
import { signerToSmartAccount } from "../../../src/index.js"
import { getChainConfig } from "../../utils.js"

describe("Biconomy Smart Account core tests", () => {
  let smartAccount: Awaited<ReturnType<typeof signerToSmartAccount>>
  let walletClient: WalletClient
  let publicClient: PublicClient

  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)

  const { chain } = getChainConfig()

  beforeAll(async () => {
    // @ts-ignore
    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    smartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })
  })

  test("Should get account address + nonce", async () => {
    const address = smartAccount.address

    const nonce = await smartAccount.getNonce()
  })

  test("should get validation module address", async () => {
    const response = smartAccount.defaultValidationModule.getModuleAddress()
    expect(response).toBe(DEFAULT_ECDSA_OWNERSHIP_MODULE)
  })

  test("should get validation module signer", async () => {
    const response = await smartAccount.defaultValidationModule.getSigner()
    walletClient.account &&
      expect(response.address).toBe(walletClient.account.address)
  })
})
