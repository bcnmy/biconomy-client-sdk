import { http, Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"

import {
  type BiconomySmartAccountV2,
  createECDSAOwnershipValidationModule,
  createSmartAccountClient
} from "../../src"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getConfig, topUp } from "../utils"

describe("Modules:Write", () => {
  const withSponsorship = {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED }
  }

  const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl,
    paymasterUrlTwo
  } = getConfig()

  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

  const recipient = accountTwo.address

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })

  test("should send some nativeToken using default ecdsa module", async () => {
    const ecdsaModule = await createECDSAOwnershipValidationModule({
      signer: walletClient
    })

    const smartAccount = await createSmartAccountClient({
      chainId,
      bundlerUrl,
      paymasterUrl,
      signer: walletClient,
      activeValidationModule: ecdsaModule
    })

    const smartAccountAddress = await smartAccount.getAccountAddress()

    await topUp(smartAccountAddress, BigInt(1000000000000000000))

    const balanceOfRecipient = await checkBalance(recipient)

    const { wait } = await smartAccount.sendTransaction({
      to: recipient,
      value: 1n
    })

    const {
      receipt: { transactionHash },
      success
    } = await wait(3)

    expect(success).toBe("true")

    const newBalanceOfRecipient = await checkBalance(recipient)

    expect(transactionHash).toBeTruthy()
    expect(newBalanceOfRecipient - balanceOfRecipient).toBe(1n)
  }, 30000)
})
