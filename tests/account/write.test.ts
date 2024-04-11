import {
  http,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient,
  NATIVE_TOKEN_ALIAS
} from "../../src/account"
import { PaymasterMode } from "../../src/paymaster"
import { testOnlyOnOptimism } from "../setupFiles"
import { checkBalance, getConfig } from "../utils"

describe("Account: Write", () => {
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
    const { wait } = await smartAccount.sendTransaction(
      {
        to: recipient,
        value: 1
      },
      {
        simulationType: "validation_and_execution"
      }
    )

    const result = await wait()
    const newBalance = (await checkBalance(publicClient, recipient)) as bigint

    expect(result?.receipt?.transactionHash).toBeTruthy()
    expect(newBalance - balance).toBe(1n)
  }, 50000)

  test("should gaslessly mint an NFT", async () => {
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [recipient]
    })

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall
    }

    const balance = (await checkBalance(
      publicClient,
      recipient,
      nftAddress
    )) as bigint

    const maticBalanceBefore = await checkBalance(
      publicClient,
      await smartAccount.getAddress()
    )

    const response = await smartAccount.sendTransaction(transaction, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      simulationType: "validation"
    })

    const userOpReceipt = await response.wait(3)
    expect(userOpReceipt.userOpHash).toBeTruthy()
    expect(userOpReceipt.success).toBe("true")

    const maticBalanceAfter = await checkBalance(
      publicClient,
      await smartAccount.getAddress()
    )

    expect(maticBalanceAfter).toEqual(maticBalanceBefore)

    const newBalance = (await checkBalance(
      publicClient,
      recipient,
      nftAddress
    )) as bigint

    expect(newBalance - balance).toBe(1n)
  }, 60000)

  test("should deploy a smart account with native token balance", async () => {
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

    // Setup:
    const hash = await walletClient.sendTransaction({
      to: smartAccountAddress,
      value: BigInt(100000000000000000),
      account,
      chain
    }) // Send enough native token to counterfactual address to deploy the smart account
    const transaction = await publicClient.waitForTransactionReceipt({ hash })
    expect(transaction).toBeTruthy()

    // Test:
    const { wait } = await smartAccount.deploy()
    const { success } = await wait()

    const byteCode = await publicClient.getBytecode({
      address: smartAccountAddress
    })
    expect(success).toBe("true")
    expect(byteCode).toBeTruthy()
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
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    })
    const { success } = await wait()

    const byteCode = await publicClient.getBytecode({
      address: smartAccountAddress
    })
    expect(success).toBe("true")
    expect(byteCode).toBeTruthy()
  }, 60000)

  testOnlyOnOptimism(
    "should send some native token to a recipient on optimism",
    async () => {
      const accountAddress = await smartAccount.getAddress()

      const balanceOfRecipient = (await checkBalance(
        publicClient,
        recipient
      )) as bigint
      const smartAccountBalance = (await checkBalance(
        publicClient,
        accountAddress
      )) as bigint
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
      const newBalanceOfRecipient = (await checkBalance(
        publicClient,
        recipient
      )) as bigint

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

  testOnlyOnOptimism(
    "should gaslessly mint an NFT on optimism",
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

      const balance = (await checkBalance(
        publicClient,
        recipient,
        nftAddress
      )) as bigint

      const maticBalanceBefore = await checkBalance(
        publicClient,
        await smartAccount.getAddress()
      )

      const response = await smartAccount.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        simulationType: "validation_and_execution"
      })

      const userOpReceipt = await response.wait(3)
      expect(userOpReceipt.userOpHash).toBeTruthy()
      expect(userOpReceipt.success).toBe("true")

      const maticBalanceAfter = await checkBalance(
        publicClient,
        await smartAccount.getAddress()
      )

      expect(maticBalanceAfter).toEqual(maticBalanceBefore)

      const newBalance = (await checkBalance(
        publicClient,
        recipient,
        nftAddress
      )) as bigint

      expect(newBalance - balance).toBe(1n)
    },
    50000
  )

  test("should withdraw erc20 balances", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977"

    const smartAccountOwner = walletClient.account.address
    const smartAccountAddress = await smartAccount.getAddress()
    const usdtBalanceOfSABefore = await checkBalance(
      publicClient,
      smartAccountAddress,
      usdt
    )
    const usdtBalanceOfRecipientBefore = await checkBalance(
      publicClient,
      smartAccountOwner,
      usdt
    )

    const { wait } = await smartAccount.withdraw([
      { address: usdt, amount: BigInt(1), recipient: smartAccountOwner }
    ])

    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()

    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const usdtBalanceOfSAAfter = (await checkBalance(
      publicClient,
      smartAccountAddress,
      usdt
    )) as bigint
    const usdtBalanceOfRecipientAfter = (await checkBalance(
      publicClient,
      smartAccountOwner,
      usdt
    )) as bigint

    expect(usdtBalanceOfSAAfter - usdtBalanceOfSABefore).toBe(-1n)
    expect(usdtBalanceOfRecipientAfter - usdtBalanceOfRecipientBefore).toBe(1n)
  }, 15000)

  test("should gaslessly withdraw nativeToken", async () => {
    const smartAccountOwner = walletClient.account.address

    const smartAccountAddress = await smartAccount.getAddress()
    const balanceOfSABefore = (await checkBalance(
      publicClient,
      smartAccountAddress
    )) as bigint
    const balanceOfRecipientBefore = (await checkBalance(
      publicClient,
      smartAccountOwner
    )) as bigint

    const { wait } = await smartAccount.withdraw(
      [
        {
          address: NATIVE_TOKEN_ALIAS,
          amount: BigInt(1),
          recipient: smartAccountAddress
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

    const balanceOfSAAfter = (await checkBalance(
      publicClient,
      smartAccountAddress
    )) as bigint
    const balanceOfRecipientAfter = (await checkBalance(
      publicClient,
      smartAccountOwner
    )) as bigint

    expect(balanceOfSABefore - balanceOfSAAfter).toBe(1n)
    expect(balanceOfRecipientAfter - balanceOfRecipientBefore).toBe(1n)
  }, 12000)

  test("should withdraw nativeToken and an erc20 token", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977"
    const smartAccountOwner = walletClient.account.address

    const smartAccountAddress = await smartAccount.getAddress()
    const balanceOfSABefore = (await checkBalance(
      publicClient,
      smartAccountAddress
    )) as bigint
    const balanceOfRecipientBefore = (await checkBalance(
      publicClient,
      smartAccountOwner
    )) as bigint
    const usdtBalanceOfSABefore = await checkBalance(
      publicClient,
      smartAccountAddress,
      usdt
    )
    const usdtBalanceOfRecipientBefore = await checkBalance(
      publicClient,
      smartAccountOwner,
      usdt
    )

    const { wait } = await smartAccount.withdraw(
      [
        { address: usdt, amount: BigInt(1) },
        { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
      ],
      smartAccountOwner,
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

    const balanceOfSAAfter = (await checkBalance(
      publicClient,
      smartAccountAddress
    )) as bigint
    const balanceOfRecipientAfter = (await checkBalance(
      publicClient,
      smartAccountOwner
    )) as bigint
    const usdtBalanceOfSAAfter = (await checkBalance(
      publicClient,
      smartAccountAddress,
      usdt
    )) as bigint
    const usdtBalanceOfRecipientAfter = (await checkBalance(
      publicClient,
      smartAccountOwner,
      usdt
    )) as bigint

    expect(balanceOfSABefore - balanceOfSAAfter).toBe(1n)
    expect(balanceOfRecipientAfter - balanceOfRecipientBefore).toBe(1n)
    expect(usdtBalanceOfSAAfter - usdtBalanceOfSABefore).toBe(-1n)
    expect(usdtBalanceOfRecipientAfter - usdtBalanceOfRecipientBefore).toBe(1n)
  }, 60000)

  test("should withdraw all native token", async () => {
    const smartAccountOwner = walletClient.account.address
    const smartAccountAddress = await smartAccount.getAddress()
    const balanceOfSABefore = (await checkBalance(
      publicClient,
      smartAccountAddress
    )) as bigint
    const balanceOfRecipientBefore = (await checkBalance(
      publicClient,
      smartAccountOwner
    )) as bigint

    const { wait } = await smartAccount.withdraw(
      [] /* null or undefined or [] */,
      smartAccountOwner,
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

    const balanceOfSAAfter = (await checkBalance(
      publicClient,
      smartAccountAddress
    )) as bigint
    const balanceOfRecipientAfter = (await checkBalance(
      publicClient,
      smartAccountOwner
    )) as bigint

    expect(balanceOfSAAfter).toBe(0n)
    expect(balanceOfRecipientAfter).toBe(
      balanceOfSABefore + balanceOfRecipientBefore
    )

    // Teardown: send back the native token to the smart account
    const teardownHash = await signer.sendTransaction({
      to: smartAccountAddress,
      value: balanceOfSABefore,
      account,
      chain: viemChain
    })
    expect(teardownHash).toBeTruthy()
  }, 60000)

  test.skip("should mint an NFT on Mumbai and pay with ERC20 - with preferredToken", async () => {
    // const {
    //   whale: { viemWallet: signer, publicAddress: recipient },
    //   bundlerUrl,
    //   nftAddress,
    //   publicClient
    // } = baseSepolia
    // const smartAccount = await createSmartAccountClient({
    //   signer,
    //   bundlerUrl,
    //   biconomyPaymasterApiKey: "7K_k68BFN.ed274da8-69a1-496d-a897-508fc2653666"
    // })
    // const accountAddress = await smartAccount.getAddress()
    // const encodedCall = encodeFunctionData({
    //   abi: parseAbi(["function safeMint(address _to)"]),
    //   functionName: "safeMint",
    //   args: [recipient]
    // })
    // const transaction = {
    //   to: nftAddress, // NFT address
    //   data: encodedCall
    // }
    // const balance = (await checkBalance(
    //   publicClient,
    //   recipient,
    //   nftAddress
    // )) as bigint
    // const maticBalanceBefore = await checkBalance(publicClient, accountAddress)
    // const usdcBalanceBefore = await checkBalance(
    //   publicClient,
    //   accountAddress,
    //   "0xda5289fcaaf71d52a80a254da614a192b693e977"
    // )
    // const { wait } = await smartAccount.sendTransaction([transaction], {
    //   paymasterServiceData: {
    //     mode: PaymasterMode.ERC20,
    //     preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977"
    //   }
    // })
    // const {
    //   receipt: { transactionHash },
    //   userOpHash,
    //   success
    // } = await wait()
    // expect(transactionHash).toBeTruthy()
    // expect(userOpHash).toBeTruthy()
    // expect(success).toBe("true")
    // const maticBalanceAfter = await checkBalance(
    //   publicClient,
    //   await smartAccount.getAddress()
    // )
    // expect(maticBalanceAfter).toEqual(maticBalanceBefore)
    // const usdcBalanceAfter = await checkBalance(
    //   publicClient,
    //   await smartAccount.getAddress(),
    //   "0xda5289fcaaf71d52a80a254da614a192b693e977"
    // )
    // expect(usdcBalanceAfter).toBeLessThan(usdcBalanceBefore)
    // const newBalance = (await checkBalance(
    //   publicClient,
    //   recipient,
    //   nftAddress
    // )) as bigint
    // expect(newBalance - balance).toBe(1n)
  }, 60000)

  test.skip("should mint an NFT on Mumbai and pay with ERC20 - with token selection and no maxApproval", async () => {
    // const preferredToken: Hex = "0xda5289fcaaf71d52a80a254da614a192b693e977";
    // const {
    //   whale: { viemWallet: signer, publicAddress: recipient },
    //   bundlerUrl,
    //   paymasterUrl,
    //   publicClient,
    //   nftAddress,
    // } = baseSepolia;
    // const smartAccount = await createSmartAccountClient({
    //   signer,
    //   bundlerUrl,
    //   paymasterUrl,
    // });
    // const smartAccountAddress = await smartAccount.getAddress();
    // const encodedCall = encodeFunctionData({
    //   abi: parseAbi(["function safeMint(address _to)"]),
    //   functionName: "safeMint",
    //   args: [recipient],
    // });
    // const transaction = {
    //   to: nftAddress, // NFT address
    //   data: encodedCall,
    // };
    // const feeQuotesResponse = await smartAccount.getTokenFees(transaction, {
    //   paymasterServiceData: {
    //     mode: PaymasterMode.ERC20,
    //     preferredToken,
    //   },
    // });
    // const selectedFeeQuote = feeQuotesResponse.feeQuotes?.[0];
    // const spender = feeQuotesResponse.tokenPaymasterAddress!;
    // const contract = getContract({
    //   address: preferredToken,
    //   abi: parseAbi(ERC20_ABI),
    //   client: publicClient,
    // });
    // const allowanceBefore = (await contract.read.allowance([smartAccountAddress, spender])) as bigint;
    // if (allowanceBefore > 0) {
    //   const decreaseAllowanceData = encodeFunctionData({
    //     abi: parseAbi(["function decreaseAllowance(address spender, uint256 subtractedValue)"]),
    //     functionName: "decreaseAllowance",
    //     args: [spender, allowanceBefore],
    //   });
    //   const decreaseAllowanceTx = {
    //     to: "0xda5289fcaaf71d52a80a254da614a192b693e977",
    //     data: decreaseAllowanceData,
    //   };
    //   const { wait } = await smartAccount.sendTransaction(decreaseAllowanceTx, { paymasterServiceData: { mode: PaymasterMode.SPONSORED } });
    //   const { success } = await wait();
    //   expect(success).toBe("true");
    //   const allowanceAfter = (await contract.read.allowance([smartAccountAddress, spender])) as bigint;
    //   expect(allowanceAfter).toBe(0n);
    // }
    // const balance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;
    // const maticBalanceBefore = await checkBalance(publicClient, smartAccountAddress);
    // const usdcBalanceBefore = await checkBalance(publicClient, smartAccountAddress, preferredToken);
    // const { wait } = await smartAccount.sendTransaction(transaction, {
    //   paymasterServiceData: {
    //     mode: PaymasterMode.ERC20,
    //     feeQuote: selectedFeeQuote,
    //     spender: feeQuotesResponse.tokenPaymasterAddress,
    //   },
    // });
    // const {
    //   receipt: { transactionHash },
    //   userOpHash,
    //   success,
    // } = await wait();
    // expect(userOpHash).toBeTruthy();
    // expect(success).toBe("true");
    // expect(transactionHash).toBeTruthy();
    // const maticBalanceAfter = await checkBalance(publicClient, smartAccountAddress);
    // expect(maticBalanceAfter).toEqual(maticBalanceBefore);
    // const usdcBalanceAfter = await checkBalance(publicClient, smartAccountAddress, preferredToken);
    // expect(usdcBalanceAfter).toBeLessThan(usdcBalanceBefore);
    // const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;
    // expect(newBalance - balance).toBe(1n);
  }, 60000)
})
