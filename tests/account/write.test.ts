import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  getContract,
  parseAbi,
  encodeFunctionData
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ERC20_ABI,
  createSmartAccountClient
} from "../../src/account"
import { EntryPointAbi } from "../../src/account/abi/EntryPointAbi"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getConfig, nonZeroBalance, topUp } from "../utils"
import { testOnlyOnOptimism } from "../setupFiles"

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

  test("should send some native token to recipient via the entrypoint", async () => {
    const balanceOfRecipient = await checkBalance(recipient)

    // biome-ignore lint/style/useConst: <explanation>
    let userOp = await smartAccount.buildUserOp([
      {
        to: recipient,
        value: 1n
      }
    ])

    userOp.signature = undefined

    const signedUserOp = await smartAccount.signUserOp(userOp)

    const entrypointContract = getContract({
      address: DEFAULT_ENTRYPOINT_ADDRESS,
      abi: EntryPointAbi,
      client: { public: publicClient, wallet: walletClient }
    })

    const hash = await entrypointContract.write.handleOps([
      [
        {
          sender: signedUserOp.sender as Hex,
          nonce: BigInt(signedUserOp.nonce ?? 0),
          callGasLimit: BigInt(signedUserOp.callGasLimit ?? 0),
          verificationGasLimit: BigInt(signedUserOp.verificationGasLimit ?? 0),
          preVerificationGas: BigInt(signedUserOp.preVerificationGas ?? 0),
          maxFeePerGas: BigInt(signedUserOp.maxFeePerGas ?? 0),
          maxPriorityFeePerGas: BigInt(signedUserOp.maxPriorityFeePerGas ?? 0),
          initCode: signedUserOp.initCode as Hex,
          callData: signedUserOp.callData as Hex,
          paymasterAndData: signedUserOp.paymasterAndData as Hex,
          signature: signedUserOp.signature as Hex
        }
      ],
      sender
    ])

    const { status, transactionHash } =
      await publicClient.waitForTransactionReceipt({ hash })

    expect(status).toBe("success")
    expect(transactionHash).toBeTruthy()

    const balanceOfRecipientAfter = await checkBalance(recipient)

    expect(balanceOfRecipientAfter - balanceOfRecipient).toBe(1n)
  }, 50000)

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
    const nativeBalanceBefore = await checkBalance(smartAccountAddress)
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
    const nativeBalanceAfter = await checkBalance(smartAccountAddress)
    expect(nativeBalanceAfter).toEqual(nativeBalanceBefore)
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

    const balance = await checkBalance(recipient, nftAddress)
    const nativeBalanceBefore = await checkBalance(smartAccountAddress)
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
    const nativeBalanceAfter = await checkBalance(smartAccountAddress)
    expect(nativeBalanceAfter).toEqual(nativeBalanceBefore)
    const tokenBalanceAfter = await checkBalance(smartAccountAddress, token)
    expect(tokenBalanceAfter).toBeLessThan(tokenBalanceBefore)
    const newBalance = await checkBalance(recipient, nftAddress)
    expect(newBalance - balance).toBe(1n)
  }, 60000)

  describe("Account:User Op Gas Offset", () => {
    test("should increment user op gas with no paymaster using sendTransaction", async () => {
      const transaction = {
        to: recipient,
        data: "0x"
      }

      const { wait } = await smartAccount.sendTransaction(transaction, {
        gasOffset: {
          verificationGasLimitIncrement: 10000,
          preVerificationGasIncrement: 1000,
          maxFeePerGasIncrement: 10,
          callGasLimitIncrement: 1000,
          maxPriorityFeePerGasIncrement: 10
        }
      })
      const {
        receipt: { transactionHash },
        receipt,
        userOpHash,
        success
      } = await wait()  

      expect(userOpHash).toBeTruthy()
      expect(success).toBe("true")
      expect(transactionHash).toBeTruthy()
    }, 60000)

    test("should increment user op gas with ERC20 Paymaster using sendTransaction", async () => {
      const transaction = {
        to: recipient, 
        data: "0x"
      }

      const { wait } = await smartAccount.sendTransaction(transaction, {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20, preferredToken: token
        },
        gasOffset: {
          verificationGasLimitIncrement: 10000,
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
    }, 60000)

    test("should increment user op gas with Sponsored Paymaster using sendTransaction", async () => {
      const transaction = {
        to: recipient, 
        data: "0x"
      }

      const userOpWithoutGasOffset = await smartAccount.buildUserOp([transaction], {paymasterServiceData: {mode: PaymasterMode.SPONSORED}});

      const { wait } = await smartAccount.sendTransaction(transaction, {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED
        },
        gasOffset: {
          verificationGasLimitIncrement: 10000,
          preVerificationGasIncrement: 1000,
          maxFeePerGasIncrement: 10,
          callGasLimitIncrement: 1000,
          maxPriorityFeePerGasIncrement: 10
        }
      })
      const {
        userOpHash,
        receipt: { transactionHash },
        success
      } = await wait()

      expect(userOpHash).toBeTruthy()
      expect(success).toBe("true")
      expect(transactionHash).toBeTruthy()
    }, 60000)

    test("should increment user op gas fields without Paymaster using buildUserOp + sendUserOp", async () => {
      const transaction = {
        to: recipient, // NFT address
        data: "0x"
      }

      const userOpWithoutGasOffset = await smartAccount.buildUserOp(
        [transaction], 
      );

      const userOp = await smartAccount.buildUserOp(
        [transaction], 
        {gasOffset: {
            verificationGasLimitIncrement: 10000,
            preVerificationGasIncrement: 1000,
            maxFeePerGasIncrement: 10,
            callGasLimitIncrement: 1000,
            maxPriorityFeePerGasIncrement: 10
          }
        }
      );

      expect(Number(userOp.verificationGasLimit) - Number(userOpWithoutGasOffset.verificationGasLimit)).toEqual(10000); 
      expect(Number(userOp.preVerificationGas) - Number(userOpWithoutGasOffset.preVerificationGas)).toEqual(1000);
      expect(Number(userOp.maxFeePerGas) - Number(userOpWithoutGasOffset.maxFeePerGas)).toEqual(10);
      expect(Number(userOp.callGasLimit) - Number(userOpWithoutGasOffset.callGasLimit)).toEqual(1000);
      expect(Number(userOp.maxPriorityFeePerGas) - Number(userOpWithoutGasOffset.maxPriorityFeePerGas)).toEqual(10);

      await smartAccount.sendUserOp(userOp);
    }, 60000)

    test("should increment user op gas fields with paymaster using buildUserOp + sendUserOp", async () => {
      const transaction = {
        to: recipient, // NFT address
        data: "0x"
      }

      const userOpWithoutGasOffset = await smartAccount.buildUserOp(
        [transaction], 
        {
          paymasterServiceData: {
            mode: PaymasterMode.SPONSORED,
            calculateGasLimits: false
          },
        },
      );

      const userOp = await smartAccount.buildUserOp(
        [transaction], 
        {paymasterServiceData: 
          {mode: PaymasterMode.SPONSORED}, 
          gasOffset: {
            verificationGasLimitIncrement: 10000,
            preVerificationGasIncrement: 1000,
            maxFeePerGasIncrement: 10,
            callGasLimitIncrement: 1000,
            maxPriorityFeePerGasIncrement: 10
          }
        }
      );

      console.log(Number(userOpWithoutGasOffset.verificationGasLimit), "USER OP WITHOUT GAS OFFSET");
      console.log(Number(userOp.verificationGasLimit), "USER OP WITH GAS OFFSET");

      expect(Number(userOp.verificationGasLimit) - Number(userOpWithoutGasOffset.verificationGasLimit)).toEqual(10000); 
      expect(Number(userOp.preVerificationGas) - Number(userOpWithoutGasOffset.preVerificationGas)).toEqual(1000);
      expect(Number(userOp.maxFeePerGas) - Number(userOpWithoutGasOffset.maxFeePerGas)).toEqual(10);
      expect(Number(userOp.callGasLimit) - Number(userOpWithoutGasOffset.callGasLimit)).toEqual(1000);
      expect(Number(userOp.maxPriorityFeePerGas) - Number(userOpWithoutGasOffset.maxPriorityFeePerGas)).toEqual(10);

      await smartAccount.sendUserOp(userOp);
    }, 60000)

    test("should increment user op gas fields with ERC20 paymaster using buildUserOp + sendUserOp", async () => {
      const transaction = {
        to: recipient, // NFT address
        data: "0x"
      }

      const userOpWithoutGasOffset = await smartAccount.buildUserOp(
        [transaction], 
        {
          paymasterServiceData: {
            mode: PaymasterMode.ERC20,
            preferredToken: token,
            calculateGasLimits: false
          },
        },
      );

      const userOp = await smartAccount.buildUserOp(
        [transaction], 
        {paymasterServiceData: 
          {mode: PaymasterMode.ERC20, preferredToken: token}, 
          gasOffset: {
            verificationGasLimitIncrement: 10000,
            preVerificationGasIncrement: 1000,
            maxFeePerGasIncrement: 10,
            callGasLimitIncrement: 1000,
            maxPriorityFeePerGasIncrement: 10
          }
        }
      );

      console.log(Number(userOpWithoutGasOffset.verificationGasLimit), "USER OP WITHOUT GAS OFFSET");
      console.log(Number(userOp.verificationGasLimit), "USER OP WITH GAS OFFSET");

      expect(Number(userOp.verificationGasLimit) - Number(userOpWithoutGasOffset.verificationGasLimit)).toEqual(10000); 
      expect(Number(userOp.preVerificationGas) - Number(userOpWithoutGasOffset.preVerificationGas)).toEqual(1000);
      expect(Number(userOp.maxFeePerGas) - Number(userOpWithoutGasOffset.maxFeePerGas)).toEqual(10);
      expect(Number(userOp.callGasLimit) - Number(userOpWithoutGasOffset.callGasLimit)).toEqual(1000);
      expect(Number(userOp.maxPriorityFeePerGas) - Number(userOpWithoutGasOffset.maxPriorityFeePerGas)).toEqual(10);

      await smartAccount.sendUserOp(userOp);
    }, 60000)
  })
})
