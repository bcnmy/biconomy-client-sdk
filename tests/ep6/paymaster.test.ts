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
import { waitForTransactionReceipt } from "viem/actions"
import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers.js"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"
import { createPaymasterClient } from "../../src/paymaster/createPaymasterClient.js"
import { PaymasterMode } from "../../src/paymaster/utils/types.js"
import { testForBaseSopelia } from "../setupFiles.js"
import { getChainConfig } from "../utils.js"

describe("Paymaster tests", async () => {
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)

  const { chain, chainId, paymasterUrl, bundlerUrl } = getChainConfig()

  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
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

  test.concurrent("Should have the properties of a viem client", async () => {
    const paymasterClient = createPaymasterClient({
      chain,
      transport: http(paymasterUrl)
    })
    expect(paymasterClient.uid).toBeDefined()
    expect(paymasterClient?.chain?.id).toBe(chainId)
    expect(paymasterClient.pollingInterval).toBeDefined()
  })

  test.concurrent("Should return sponsored user operation values", async () => {
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

    const result = await paymasterClient.sponsorUserOperation({
      userOperation: userOp,
      mode: PaymasterMode.SPONSORED
    })

    expect(result).toBeTruthy()
  })

  test("Should send a sponsored user operation using sendUserOperation", async () => {
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
        sponsorUserOperation: paymasterClient.sponsorUserOperation
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
  }, 50000)

  testForBaseSopelia(
    "Should return sponsored user operation values",
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

      const result = await paymasterClient.sponsorUserOperation({
        userOperation: userOp,
        mode: PaymasterMode.SPONSORED
      })

      expect(result).toBeTruthy()
    }
  )

  test("Should send a sponsored user operation using sendTransaction", async () => {
    const paymasterClient = createPaymasterClient({
      transport: http(paymasterUrl)
    })
    const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [smartAccount.address]
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
        sponsorUserOperation: paymasterClient.sponsorUserOperation
      }
    })

    const txHash = await sponsoredSmartAccountClient.sendTransaction({
      to: nftAddress,
      value: 0n,
      data: encodedCall
    })

    const receipt = await waitForTransactionReceipt(publicClient, {
      hash: txHash
    })

    expect(receipt).toBeTruthy()
    expect(txHash).toBeTruthy()
  }, 50000)
})
