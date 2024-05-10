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
import { readContract } from "viem/actions"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ERC20_ABI,
  createSmartAccountClient,
  percentage
} from "../../src/account"
import { ECDSAModuleAbi } from "../../src/account/abi/ECDSAModule"
import { EntryPointAbi } from "../../src/account/abi/EntryPointAbi"
import { getAAError } from "../../src/bundler/utils/getAAError"
import {
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE
} from "../../src/modules"
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

  test("should send some native token to recipient via the entrypoint", async () => {
    const balanceOfRecipient = await checkBalance(recipient)

    // biome-ignore lint/style/useConst: <explanation>
    let userOp = await smartAccount.buildUserOp([
      {
        to: recipient,
        value: 1n
      }
    ])

    console.log(await smartAccount.getAccountAddress())
    console.log(await smartAccount.getSigner().getAddress(), "signer address")

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
  }, 40000)

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
    test("should increment user op verificationGasLimit by 50%. Paymaster OFF", async () => {
      const transaction = {
        to: recipient,
        data: "0x"
      }

      const userOpWithNoOffset = await smartAccount.buildUserOp([transaction])
      const userOpWithOffset = await smartAccount.buildUserOp([transaction], {
        gasOffset: {
          verificationGasLimitOffsetPct: 50 // 50% increase
        }
      })

      const difference = Math.round(
        Number(userOpWithOffset.verificationGasLimit) -
          Number(userOpWithNoOffset.verificationGasLimit)
      )
      const percentageValue = Math.round(
        percentage(difference, Number(userOpWithNoOffset.verificationGasLimit))
      )

      expect(percentageValue).toBe(50)
    }, 60000)

    test("should increment user op gas values. Paymaster OFF", async () => {
      const transaction = {
        to: recipient,
        data: "0x"
      }

      const userOpWithNoOffset = await smartAccount.buildUserOp([transaction])
      const userOpWithOffset = await smartAccount.buildUserOp([transaction], {
        gasOffset: {
          verificationGasLimitOffsetPct: 50, // 50% increase
          preVerificationGasOffsetPct: 100 // 100% increase
        }
      })

      const vglDifference = Math.round(
        Number(userOpWithOffset.verificationGasLimit) -
          Number(userOpWithNoOffset.verificationGasLimit)
      )
      const cgllDifference = Math.round(
        Number(userOpWithOffset.callGasLimit) -
          Number(userOpWithNoOffset.callGasLimit)
      )
      const pvgDifference = Math.round(
        Number(userOpWithOffset.preVerificationGas) -
          Number(userOpWithNoOffset.preVerificationGas)
      )

      const vglPercentageValue = Math.round(
        percentage(
          vglDifference,
          Number(userOpWithNoOffset.verificationGasLimit)
        )
      )
      const cglPercentageValue = Math.round(
        percentage(cgllDifference, Number(userOpWithNoOffset.callGasLimit))
      )
      const pvgPercentageValue = Math.round(
        percentage(pvgDifference, Number(userOpWithNoOffset.preVerificationGas))
      )

      expect(vglPercentageValue).toBe(50)
      expect(cglPercentageValue).toBe(0)
      expect(pvgPercentageValue).toBe(100)
    }, 60000)

    test("should increment user op gas values. Paymaster ON", async () => {
      const transaction = {
        to: recipient,
        data: "0x"
      }

      const userOpWithNoOffset = await smartAccount.buildUserOp([transaction], {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        gasOffset: {
          verificationGasLimitOffsetPct: 0 // no increment but provided to avoid paymaster gas calculation (just for testing purposes)
        }
      }) // Passing gasOffset to avoid paymaster gas calculation
      const userOpWithOffset = await smartAccount.buildUserOp([transaction], {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        gasOffset: {
          verificationGasLimitOffsetPct: 13.2, // 13.2% increase
          preVerificationGasOffsetPct: 81 // 81% increase
        }
      })

      const vglDifference = Math.round(
        Number(userOpWithOffset.verificationGasLimit) -
          Number(userOpWithNoOffset.verificationGasLimit)
      )
      const cgllDifference = Math.round(
        Number(userOpWithOffset.callGasLimit) -
          Number(userOpWithNoOffset.callGasLimit)
      )
      const pvgDifference = Math.round(
        Number(userOpWithOffset.preVerificationGas) -
          Number(userOpWithNoOffset.preVerificationGas)
      )

      const vglPercentageValue = Math.round(
        percentage(
          vglDifference,
          Number(userOpWithNoOffset.verificationGasLimit)
        )
      )
      const cglPercentageValue = Math.round(
        percentage(cgllDifference, Number(userOpWithNoOffset.callGasLimit))
      )
      const pvgPercentageValue = Math.round(
        percentage(pvgDifference, Number(userOpWithNoOffset.preVerificationGas))
      )

      expect(vglPercentageValue).toBe(13)
      expect(cglPercentageValue).toBe(0)
      expect(pvgPercentageValue).toBe(81)
    }, 60000)

    test("should throw if percentage given is bigger than 100. Paymaster ON", async () => {
      const transaction = {
        to: recipient,
        data: "0x"
      }

      const userOpWithNoOffset = await smartAccount.buildUserOp([transaction], {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        gasOffset: {
          verificationGasLimitOffsetPct: 0 // no increment, just for testing purposes
        }
      }) // Passing gasOffset to avoid paymaster gas calculation
      const userOpWithOffset = smartAccount.buildUserOp([transaction], {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        gasOffset: {
          verificationGasLimitOffsetPct: 110 // 110% increase (not allowed)
        }
      })

      expect(userOpWithOffset).rejects.toThrowError(
        "The percentage value should be between 1 and 100."
      )
    }, 60000)

    test("should increment user op gas with no paymaster using sendTransaction", async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })
      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }

      const { wait } = await smartAccount.sendTransaction(transaction, {
        gasOffset: {
          verificationGasLimitOffsetPct: 10, // 10% increase
          preVerificationGasOffsetPct: 20, // 20% increase
          maxFeePerGasOffsetPct: 30, // 30% increase
          callGasLimitOffsetPct: 40, // 40% increase
          maxPriorityFeePerGasOffsetPct: 50 // 50% increase
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
  })

  describe("Transfer ownership", () => {
    test("should transfer ownership of smart account to accountTwo", async () => {
      const newOwner = accountTwo.address
      const _smartAccount = await createSmartAccountClient({
        signer: walletClient,
        paymasterUrl,
        bundlerUrl,
        accountAddress: "0xe6dBb5C8696d2E0f90B875cbb6ef26E3bBa575AC" 
      })
      const _smartAccountAddress = await _smartAccount.getAccountAddress()
      console.log("Smart account address: ", _smartAccountAddress)

      const signerOfAccount = walletClient.account.address
      const ownerOfAccount = await publicClient.readContract({
        address: "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e",
        abi: ECDSAModuleAbi,
        functionName: "getOwner",
        args: [await _smartAccount.getAccountAddress()]
      })

      expect(ownerOfAccount).toBe(signerOfAccount)
      const response = await _smartAccount.transferOwnership(newOwner, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const signerAddress = await _smartAccount.getSigner().getAddress()
      console.log("New owner address: ", newOwner)
      console.log("Signer address: ", signerAddress)
      expect(response.status).toBe("success")
    }, 35000)

    test("send an user op with the new owner", async () => {
      const _smartAccount = await createSmartAccountClient({
        signer: walletClientTwo,
        paymasterUrl,
        bundlerUrl,
        accountAddress: "0xe6dBb5C8696d2E0f90B875cbb6ef26E3bBa575AC" 
      })
      const newOwner = accountTwo.address
      const currentSmartAccountInstanceSigner = await _smartAccount
        .getSigner()
        .getAddress()
      expect(currentSmartAccountInstanceSigner).toBe(newOwner)
      const tx = {
        to: nftAddress,
        data: encodeFunctionData({
          abi: parseAbi(["function safeMint(address _to)"]),
          functionName: "safeMint",
          args: [smartAccountAddressTwo]
        })
      }
      const { wait } = await _smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const response = await wait()
      expect(response.success).toBe("true")
    }, 35000)

    test("should revert if sending an user op with the old owner", async () => {
      const _smartAccount = await createSmartAccountClient({
        signer: walletClient,
        paymasterUrl,
        bundlerUrl,
        accountAddress: "0xe6dBb5C8696d2E0f90B875cbb6ef26E3bBa575AC" 
      })
      const tx = {
        to: nftAddress,
        data: encodeFunctionData({
          abi: parseAbi(["function safeMint(address _to)"]),
          functionName: "safeMint",
          args: [smartAccountAddressTwo]
        })
      }
      await expect(
        _smartAccount.sendTransaction(tx, {
          paymasterServiceData: { mode: PaymasterMode.SPONSORED }
        })
      ).rejects.toThrowError(
        await getAAError("Error coming from Bundler: AA24 signature error")
      )
    }, 35000)

    test("should transfer ownership of smart account back to EOA 1", async () => {
      const newOwner = account.address
      const _smartAccount = await createSmartAccountClient({
        signer: walletClientTwo,
        paymasterUrl,
        bundlerUrl,
        accountAddress: "0xe6dBb5C8696d2E0f90B875cbb6ef26E3bBa575AC" // account address at index 0 of EOA 1
      })

      const signerOfAccount = walletClientTwo.account.address
      const ownerOfAccount = await publicClient.readContract({
        address: "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e",
        abi: ECDSAModuleAbi,
        functionName: "getOwner",
        args: [await _smartAccount.getAccountAddress()]
      })

      expect(ownerOfAccount).toBe(signerOfAccount)

      const response = await _smartAccount.transferOwnership(newOwner, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      expect(response.status).toBe("success")
    }, 45000)
  });
})
