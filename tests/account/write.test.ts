import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getContract,
  parseAbi
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  ERC20_ABI,
  createSmartAccountClient
} from "../../src/account"
import { PaymasterMode } from "../../src/paymaster"
import { testOnlyOnOptimism } from "../setupFiles"
import { checkBalance, getConfig, nonZeroBalance, topUp } from "../utils"

describe("Account:Write", () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
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

  test("should deploy a smart account with native token balance", async () => {
    const newPrivateKey = generatePrivateKey()
    const newAccount = privateKeyToAccount(newPrivateKey)

    const newViemWallet = createWalletClient({
      account: newAccount,
      chain,
      transport: http()
    })

    const newSmartAccount = await createSmartAccountClient({
      signer: newViemWallet,
      paymasterUrl,
      bundlerUrl
    })

    const newSmartAccountAddress = await newSmartAccount.getAccountAddress()

    // Setup:
    await topUp(newSmartAccountAddress, BigInt(100000000000000000))

    const balanceCheck = await checkBalance(newSmartAccountAddress)

    // Test:
    const { wait } = await newSmartAccount.deploy()
    const { success } = await wait()

    const byteCode = await publicClient.getBytecode({
      address: newSmartAccountAddress
    })
    expect(success).toBe("true")
    expect(byteCode).toBeTruthy()
  }, 60000)

  testOnlyOnOptimism(
    "should send some native token to a recipient on optimism",
    async () => {
      const balanceOfRecipient = await checkBalance(recipient)

      const { wait } = await smartAccount.sendTransaction(
        {
          to: recipient,
          value: BigInt(1)
        },
        {
          simulationType: "validation_and_execution"
        }
      )

      const result = await wait()
      const newBalanceOfRecipient = await checkBalance(recipient)

      expect(result?.receipt?.transactionHash).toBeTruthy()
      expect(result.success).toBe("true")
      expect(newBalanceOfRecipient).toBeGreaterThan(balanceOfRecipient)
    },
    50000
  )

  testOnlyOnOptimism(
    "should create a smart account with paymaster with an api key on optimism",
    async () => {
      const paymaster = smartAccount.paymaster
      expect(paymaster).not.toBeNull()
      expect(paymaster).not.toBeUndefined()
    }
  )

  test("should withdraw erc20 balances", async () => {
    await nonZeroBalance(smartAccountAddress, token)

    const tokenBalanceOfSABefore = await checkBalance(
      smartAccountAddress,
      token
    )
    const tokenBalanceOfRecipientBefore = await checkBalance(sender, token)
    const { wait } = await smartAccount.withdraw(
      [{ address: token, amount: BigInt(1), recipient: sender }],
      undefined,
      {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED
        }
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

    const tokenBalanceOfSAAfter = await checkBalance(smartAccountAddress, token)
    const tokenBalanceOfRecipientAfter = await checkBalance(sender, token)

    expect(tokenBalanceOfSAAfter - tokenBalanceOfSABefore).toBe(-1n)
    expect(tokenBalanceOfRecipientAfter - tokenBalanceOfRecipientBefore).toBe(
      1n
    )
  }, 25000)

  test("should mint an NFT and pay with ERC20 - with token", async () => {
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [recipient]
    })
    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall
    }
    const balance = await checkBalance(recipient, nftAddress)
    const maticBalanceBefore = await checkBalance(smartAccountAddress)
    const tokenBalanceBefore = await checkBalance(smartAccountAddress, token)
    const { wait } = await smartAccount.sendTransaction([transaction], {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: token
      }
    })
    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()
    expect(transactionHash).toBeTruthy()
    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    const maticBalanceAfter = await checkBalance(smartAccountAddress)
    expect(maticBalanceAfter).toEqual(maticBalanceBefore)
    const tokenBalanceAfter = await checkBalance(smartAccountAddress, token)
    expect(tokenBalanceAfter).toBeLessThan(tokenBalanceBefore)
    const newBalance = await checkBalance(recipient, nftAddress)
    expect(newBalance - balance).toBe(1n)
  }, 60000)

  test("should mint an NFT and pay with ERC20 - with token selection and no maxApproval", async () => {
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [recipient]
    })
    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall
    }
    const feeQuotesResponse = await smartAccount.getTokenFees(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: token
      }
    })
    const selectedFeeQuote = feeQuotesResponse.feeQuotes?.[0]
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const spender = feeQuotesResponse.tokenPaymasterAddress!
    const contract = getContract({
      address: token,
      abi: parseAbi(ERC20_ABI),
      client: publicClient
    })
    const allowanceBefore = (await contract.read.allowance([
      smartAccountAddress,
      spender
    ])) as bigint
    if (allowanceBefore > 0) {
      const decreaseAllowanceData = encodeFunctionData({
        abi: parseAbi([
          "function decreaseAllowance(address spender, uint256 subtractedValue)"
        ]),
        functionName: "decreaseAllowance",
        args: [spender, allowanceBefore]
      })
      const decreaseAllowanceTx = {
        to: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a",
        data: decreaseAllowanceData
      }
      const { wait } = await smartAccount.sendTransaction(decreaseAllowanceTx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
      const allowanceAfter = (await contract.read.allowance([
        smartAccountAddress,
        spender
      ])) as bigint
      expect(allowanceAfter).toBe(0n)
    }
    const balance = (await checkBalance(recipient, nftAddress)) as bigint
    const maticBalanceBefore = await checkBalance(smartAccountAddress)
    const tokenBalanceBefore = await checkBalance(smartAccountAddress, token)
    const { wait } = await smartAccount.sendTransaction(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        feeQuote: selectedFeeQuote,
        spender: feeQuotesResponse.tokenPaymasterAddress
      }
    })
    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()
    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()
    const maticBalanceAfter = await checkBalance(smartAccountAddress)
    expect(maticBalanceAfter).toEqual(maticBalanceBefore)
    const tokenBalanceAfter = await checkBalance(smartAccountAddress, token)
    expect(tokenBalanceAfter).toBeLessThan(tokenBalanceBefore)
    const newBalance = (await checkBalance(recipient, nftAddress)) as bigint
    expect(newBalance - balance).toBe(1n)
  }, 60000)
})
