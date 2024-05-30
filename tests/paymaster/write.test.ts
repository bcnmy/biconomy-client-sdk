import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  NATIVE_TOKEN_ALIAS,
  createSmartAccountClient
} from "../../src/account"
import { PaymasterMode } from "../../src/paymaster"
import { testOnlyOnOptimism } from "../setupFiles"
import { checkBalance, getConfig, nonZeroBalance, topUp } from "../utils"

describe("Paymaster:Write", () => {
  const nonceOptions = { nonceKey: Date.now() + 40 }
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
  const sender = account.address
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

  test("should mint an NFT with sponsorship", async () => {
    await nonZeroBalance(smartAccountAddress)

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [recipient]
    })

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall
    }

    const balance = await checkBalance(recipient, nftAddress)
    const maticBalanceBefore = await checkBalance(smartAccountAddress)

    const response = await smartAccount.sendTransaction(transaction, {
      nonceOptions,
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      simulationType: "validation"
    })

    const userOpReceipt = await response.wait(3)
    expect(userOpReceipt.userOpHash).toBeTruthy()
    expect(userOpReceipt.success).toBe("true")

    const maticBalanceAfter = await checkBalance(smartAccountAddress)

    expect(maticBalanceAfter).toEqual(maticBalanceBefore)

    const newBalance = (await checkBalance(recipient, nftAddress)) as bigint

    expect(newBalance - balance).toBe(1n)
  }, 60000)

  test("should deploy a smart account with sponsorship", async () => {
    const newPrivateKey = generatePrivateKey()
    const newAccount = privateKeyToAccount(newPrivateKey)

    const newViemWallet = createWalletClient({
      account: newAccount,
      chain,
      transport: http()
    })

    const smartAccount = await createSmartAccountClient({
      signer: newViemWallet,
      paymasterUrl,
      bundlerUrl
    })

    const smartAccountAddress = await smartAccount.getAccountAddress()
    const balance = await publicClient.getBalance({
      address: smartAccountAddress
    })
    expect(balance).toBe(0n)

    const { wait } = await smartAccount.deploy({
      nonceOptions,
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    })
    const { success } = await wait()

    const byteCode = await publicClient.getBytecode({
      address: smartAccountAddress
    })
    expect(success).toBe("true")
    expect(byteCode).toBeTruthy()
  }, 60000)

  test("should withdraw nativeToken with sponsorship", async () => {
    await nonZeroBalance(smartAccountAddress)

    const balanceOfSABefore = await checkBalance(smartAccountAddress)
    const balanceOfRecipientBefore = await checkBalance(sender)

    const { wait } = await smartAccount.withdraw(
      [
        {
          address: NATIVE_TOKEN_ALIAS,
          amount: BigInt(1),
          recipient: sender
        }
      ],
      null,
      {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      }
    )

    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()

    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const balanceOfSAAfter = await checkBalance(smartAccountAddress)
    const balanceOfRecipientAfter = await checkBalance(sender)

    expect(balanceOfSABefore - balanceOfSAAfter).toBe(1n)
    expect(balanceOfRecipientAfter - balanceOfRecipientBefore).toBe(1n)
  }, 25000)

  testOnlyOnOptimism(
    "should mint an NFT on optimism with sponsorship",
    async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [recipient]
      })

      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }

      const balance = await checkBalance(recipient, nftAddress)

      const maticBalanceBefore = await checkBalance(smartAccountAddress)

      const response = await smartAccount.sendTransaction(transaction, {
        nonceOptions,
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        simulationType: "validation_and_execution"
      })

      const userOpReceipt = await response.wait(3)
      expect(userOpReceipt.userOpHash).toBeTruthy()
      expect(userOpReceipt.success).toBe("true")

      const maticBalanceAfter = await checkBalance(smartAccountAddress)
      expect(maticBalanceAfter).toEqual(maticBalanceBefore)
      const newBalance = (await checkBalance(recipient, nftAddress)) as bigint

      expect(newBalance - balance).toBe(1n)
    },
    50000
  )

  test("should withdraw nativeToken and an erc20 token", async () => {
    const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"

    await nonZeroBalance(smartAccountAddress, token)
    await nonZeroBalance(smartAccountAddress)

    const balanceOfSABefore = await checkBalance(smartAccountAddress)
    const balanceOfRecipientBefore = await checkBalance(sender)
    const tokenBalanceOfSABefore = await checkBalance(
      smartAccountAddress,
      token
    )
    const tokenBalanceOfRecipientBefore = await checkBalance(sender, token)

    const { wait } = await smartAccount.withdraw(
      [
        { address: token, amount: BigInt(1) },
        { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
      ],
      sender,
      {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      }
    )

    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()

    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const balanceOfSAAfter = await checkBalance(smartAccountAddress)
    const balanceOfRecipientAfter = await checkBalance(sender)
    const tokenBalanceOfSAAfter = await checkBalance(smartAccountAddress, token)
    const tokenBalanceOfRecipientAfter = await checkBalance(sender, token)

    expect(balanceOfSABefore - balanceOfSAAfter).toBe(1n)
    expect(balanceOfRecipientAfter - balanceOfRecipientBefore).toBe(1n)

    expect(tokenBalanceOfSAAfter - tokenBalanceOfSABefore).toBe(-1n)
    expect(tokenBalanceOfRecipientAfter - tokenBalanceOfRecipientBefore).toBe(
      1n
    )
  }, 60000)

  test("should withdraw all native token", async () => {
    await nonZeroBalance(smartAccountAddress)
    const balanceOfSABefore = await checkBalance(smartAccountAddress)
    const balanceOfRecipientBefore = await checkBalance(sender)

    const { wait } = await smartAccount.withdraw(
      [] /* null or undefined or [] */,
      sender,
      {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED } // Will leave no dust
      }
    )

    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()

    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const balanceOfSAAfter = await checkBalance(smartAccountAddress)
    const balanceOfRecipientAfter = await checkBalance(sender)

    expect(balanceOfSAAfter).toBe(0n)
    expect(balanceOfRecipientAfter).toBe(
      balanceOfSABefore + balanceOfRecipientBefore
    )

    // Teardown: send back the native token to the smart account
    const teardownHash = await walletClient.sendTransaction({
      to: smartAccountAddress,
      value: balanceOfSABefore,
      account,
      chain
    })
    expect(teardownHash).toBeTruthy()
  }, 60000)
})
