import { http, type Hex, createPublicClient, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient,
  getChain
} from "../../src/account"
import { createBundler } from "../../src/bundler"
import {
  checkBalance,
  getBundlerUrl,
  getConfig,
  nonZeroBalance,
  topUp
} from "../utils"

describe("Bundler:Write", () => {
  const nonceOptions = { nonceKey: Date.now() + 20 }
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
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
  const recipient = accountTwo.address
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let [smartAccount, smartAccountTwo]: BiconomySmartAccountV2[] = []
  let [smartAccountAddress, smartAccountAddressTwo]: Hex[] = []

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
      ;[smartAccountAddress, smartAccountAddressTwo] = await Promise.all(
        [smartAccount, smartAccountTwo].map((account) =>
          account.getAccountAddress()
        )
      )
  })

  test("should send some native token to a recipient", async () => {
    await topUp(smartAccountAddress, 3000000000000000000n)
    const balanceOfRecipient = await checkBalance(recipient)

    const { wait } = await smartAccount.sendTransaction(
      {
        to: recipient,
        value: 1n
      },
      { nonceOptions }
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")

    const newBalanceOfRecipient = await checkBalance(recipient)

    expect(transactionHash).toBeTruthy()
    expect(newBalanceOfRecipient - balanceOfRecipient).toBe(1n)
  }, 60000)

  test("should send some native token to a recipient with a bundler instance", async () => {
    await topUp(smartAccountAddress, 3000000000000000000n)

    const balanceOfRecipient = await checkBalance(recipient)

    const smartAccountClientWithBundlerInstance =
      await createSmartAccountClient({
        signer: walletClient,
        bundler: await createBundler({
          bundlerUrl,
          userOpReceiptMaxDurationIntervals: {
            [chainId]: 50000
          }
        }),
        paymasterUrl
      })

    const { wait } =
      await smartAccountClientWithBundlerInstance.sendTransaction(
        {
          to: recipient,
          value: 1
        },
        { nonceOptions }
      )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")

    const newBalanceOfRecipient = await checkBalance(recipient)

    expect(transactionHash).toBeTruthy()
    expect(newBalanceOfRecipient - balanceOfRecipient).toBe(1n)
  }, 70000)

  test("should test a new network", async () => {
    /* Set the network id and paymaster key */
    const NETWORK_ID = 80002
    const PAYMASTER_KEY = "<API_KEY>"
    /****************************************/
    const chain = getChain(NETWORK_ID)
    const bundlerUrl = getBundlerUrl(NETWORK_ID)
    const paymasterUrl = `https://paymaster.biconomy.io/api/v1/${NETWORK_ID}/${PAYMASTER_KEY}`

    const newWalletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    const newSmartAccount = await createSmartAccountClient({
      signer: newWalletClient,
      bundlerUrl
      // paymasterUrl
    })

    expect(chain.id).toBe(NETWORK_ID)

    const { wait } = await newSmartAccount.sendTransaction(
      {
        to: recipient,
        value: 1n
      },
      { nonceOptions }
    )

    const { success } = await wait()

    expect(success).toBe("true")
  }, 70000)
})
