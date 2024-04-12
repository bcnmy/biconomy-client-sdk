import { http, createPublicClient, createWalletClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient
} from "../../src/account"
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

  test.skip("should withdraw erc20 balances", async () => {
    const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
    const smartAccountOwner = walletClient.account.address

    const smartAccountAddress = await smartAccount.getAddress()
    const tokenBalanceOfSABefore = await checkBalance(
      publicClient,
      smartAccountAddress,
      token
    )
    const tokenBalanceOfRecipientBefore = await checkBalance(
      publicClient,
      smartAccountOwner,
      token
    )
    const { wait } = await smartAccount.withdraw([
      { address: token, amount: BigInt(1), recipient: smartAccountOwner }
    ])

    const {
      receipt: { transactionHash },
      userOpHash,
      success
    } = await wait()

    expect(userOpHash).toBeTruthy()
    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const tokenBalanceOfSAAfter = (await checkBalance(
      publicClient,
      smartAccountAddress,
      token
    )) as bigint
    const tokenBalanceOfRecipientAfter = (await checkBalance(
      publicClient,
      smartAccountOwner,
      token
    )) as bigint

    expect(tokenBalanceOfSAAfter - tokenBalanceOfSABefore).toBe(-1n)
    expect(tokenBalanceOfRecipientAfter - tokenBalanceOfRecipientBefore).toBe(
      1n
    )
  }, 25000)

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
    //   "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
    // )
    // const { wait } = await smartAccount.sendTransaction([transaction], {
    //   paymasterServiceData: {
    //     mode: PaymasterMode.ERC20,
    //     preferredToken: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
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
    //   "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
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
    // const preferredToken: Hex = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a";
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
    //     to: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a",
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
