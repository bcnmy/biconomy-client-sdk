import { http, createPublicClient, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient
} from "../../src/account"
import { createBundler } from "../../src/bundler"
import { checkBalance, getConfig } from "../utils"

describe("Bundler: Write", () => {
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

  test("should send some native token to a recipient", async () => {
    const balance = (await checkBalance(publicClient, recipient)) as bigint
    const { wait } = await smartAccount.sendTransaction({
      to: recipient,
      value: 1
    })

    const result = await wait()
    const newBalance = (await checkBalance(publicClient, recipient)) as bigint

    expect(result?.receipt?.transactionHash).toBeTruthy()
    expect(newBalance - balance).toBe(1n)
  }, 50000)

  test("should send some native token to a recipient with a bundler instance", async () => {
    const balance = (await checkBalance(publicClient, recipient)) as bigint
    const smartAccountClientWithBundlerInstance =
      await createSmartAccountClient({
        signer: walletClient,
        bundler: await createBundler({ bundlerUrl }),
        paymasterUrl
      })

    const { wait } =
      await smartAccountClientWithBundlerInstance.sendTransaction({
        to: recipient,
        value: 1
      })

    const result = await wait()
    const newBalance = (await checkBalance(publicClient, recipient)) as bigint

    expect(result?.receipt?.transactionHash).toBeTruthy()
    expect(newBalance - balance).toBe(1n)
  }, 50000)
})
