import {
  http,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  zeroAddress
} from "viem"
import { describe, expect, test } from "vitest"

import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import {
  getChain,
  walletClientToSmartAccountSigner
} from "../../src/accounts/utils/helpers.js"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"
import { createPaymasterClient } from "../../src/paymaster/createPaymasterClient.js"
import { extractChainIdFromPaymasterUrl } from "../../src/paymaster/utils/helpers.js"
import {
  type FeeQuotesOrDataERC20Response,
  PaymasterMode
} from "../../src/paymaster/utils/types.js"

describe("ERC20 Paymaster tests", async () => {
  const paymasterUrl = process.env.PAYMASTER_URL ?? ""
  const chainId = extractChainIdFromPaymasterUrl(paymasterUrl)
  const chain = getChain(chainId)
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const bundlerUrl = process.env.BUNDLER_URL ?? ""

  const publicClient = createPublicClient({
    chain,
    transport: http(baseSepolia.rpcUrls.default.http[0])
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(baseSepolia.rpcUrls.default.http[0])
  })

  const smartAccount = await signerToSmartAccount(publicClient, {
    signer: walletClientToSmartAccountSigner(walletClient)
  })

  const bundlerClient = createBundlerClient({
    transport: http(bundlerUrl)
  })

  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain,
    bundlerTransport: http(bundlerUrl)
  })

  test.concurrent(
    "Should get ERC20 Paymaster supported tokens fee quotes",
    async () => {
      const paymasterClient = createPaymasterClient({
        chain,
        transport: http(paymasterUrl)
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: zeroAddress,
            value: 0n,
            data: "0x"
          })
        }
      })

      const result = await paymasterClient.getPaymasterFeeQuotesOrData({
        userOperation: userOp,
        mode: PaymasterMode.ERC20
      })

      expect(result).toBeTruthy()
    },
    15000
  )

  test.concurrent(
    "Should get ERC20 Paymaster preffered token fee quotes",
    async () => {
      const paymasterClient = createPaymasterClient({
        chain,
        transport: http(paymasterUrl)
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: zeroAddress,
            value: 0n,
            data: "0x"
          })
        }
      })

      const result = await paymasterClient.getPaymasterFeeQuotesOrData({
        userOperation: userOp,
        mode: PaymasterMode.ERC20,
        preferredToken: "0x7683022d84f726a96c4a6611cd31dbf5409c0ac9"
      })

      expect(result).toBeTruthy()
    },
    50000
  )

  test.concurrent(
    "Should get SPONSORED Paymaster fee quotes",
    async () => {
      const paymasterClient = createPaymasterClient({
        chain,
        transport: http(paymasterUrl)
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: zeroAddress,
            value: 0n,
            data: "0x"
          })
        }
      })

      const result = await paymasterClient.getPaymasterFeeQuotesOrData({
        userOperation: userOp,
        mode: PaymasterMode.SPONSORED
      })

      expect(result).toBeTruthy()
    },
    50000
  )

  test.concurrent(
    "Should send a ERC20 sponsored user operation using sendUserOperation",
    async () => {
      const paymasterClient = createPaymasterClient({
        transport: http(paymasterUrl)
      })
      const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [smartAccount.address]
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: nftAddress,
            value: 0n,
            data: encodedCall
          })
        }
      })

      const response: FeeQuotesOrDataERC20Response =
        await paymasterClient.getPaymasterFeeQuotesOrData({
          userOperation: userOp,
          mode: PaymasterMode.ERC20
        })

      const sponsoredSmartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain,
        bundlerTransport: http(bundlerUrl),
        middleware: {
          gasPrice: async () => {
            const { maxFeePerGas, maxPriorityFeePerGas } =
              await bundlerClient.getGasFeeValues()
            return { maxFeePerGas, maxPriorityFeePerGas }
          },
          sponsorUserOperation: paymasterClient.sponsorUserOperation,
          paymasterMode: PaymasterMode.ERC20,
          feeQuote: response.feeQuotes?.[0]
        }
      })

      const userOpHash = await sponsoredSmartAccountClient.sendUserOperation({
        userOperation: userOp
      })

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

      expect(receipt).toBeTruthy()
      expect(userOpHash).toBeTruthy()
    },
    50000
  )

  test.concurrent(
    "Should throw error if no feeQuote passed for ERC20 mode",
    async () => {
      const paymasterClient = createPaymasterClient({
        transport: http(paymasterUrl)
      })
      const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [smartAccount.address]
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: nftAddress,
            value: 0n,
            data: encodedCall
          })
        }
      })

      const response: FeeQuotesOrDataERC20Response =
        await paymasterClient.getPaymasterFeeQuotesOrData({
          userOperation: userOp,
          mode: PaymasterMode.ERC20
        })

      const sponsoredSmartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain,
        bundlerTransport: http(bundlerUrl),
        middleware: {
          gasPrice: async () => {
            const { maxFeePerGas, maxPriorityFeePerGas } =
              await bundlerClient.getGasFeeValues()
            return { maxFeePerGas, maxPriorityFeePerGas }
          },
          sponsorUserOperation: paymasterClient.sponsorUserOperation,
          paymasterMode: PaymasterMode.ERC20
          // feeQuote: response.feeQuotes![0],
        }
      })

      await expect(
        sponsoredSmartAccountClient.sendUserOperation({ userOperation: userOp })
      ).rejects.toThrow("No fee quote found for ERC20 Paymaster")
    },
    50000
  )
})
