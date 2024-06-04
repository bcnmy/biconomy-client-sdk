import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import { createSmartAccountClient, signerToSmartAccount } from "../../src"
import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers"
import type { KnownError } from "../../src/accounts/utils/types"
import { createBundlerClient } from "../../src/bundler"
import { ERRORS_URL } from "../../src/errors/getters/getBundlerError"
import { getChainConfig } from "../utils"

describe("Errors", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const randomPrivateKey = generatePrivateKey()
  const fundedPrivateKey: Hex = `0x${process.env.PRIVATE_KEY}`
  const unfundedAccount = privateKeyToAccount(randomPrivateKey)
  const fundedAccount = privateKeyToAccount(fundedPrivateKey)
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const errors: KnownError[] = []

  const unfundedWalletClient = createWalletClient({
    account: unfundedAccount,
    chain,
    transport: http()
  })

  const fundedWalletClient = createWalletClient({
    account: fundedAccount,
    chain,
    transport: http()
  })

  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let unfundedSmartAccount: Awaited<ReturnType<typeof signerToSmartAccount>>
  let unfundedSmartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    unfundedSmartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(unfundedWalletClient)
    })

    unfundedSmartAccountClient = createSmartAccountClient({
      account: unfundedSmartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })

    const _errors = await (await fetch(ERRORS_URL)).json()
    errors.push(..._errors)
  })

  test.concurrent(
    "should fail with SmartAccountInsufficientFundsError",
    async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [unfundedSmartAccount.address]
      })

      await expect(
        unfundedSmartAccountClient.sendTransaction({
          to: nftAddress,
          data: encodedCall
        })
      ).rejects.toThrow("SmartAccountInsufficientFundsError")
    },
    50000
  )

  test.concurrent(
    "should give advice on insufficient funds",
    async () => {
      const relevantErrorFromRequest = errors.find(
        (error: KnownError) => error.regex === "aa21"
      )

      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [unfundedSmartAccount.address]
      })

      const adviceFromRequest = relevantErrorFromRequest?.solutions[1]
      const adviceString =
        "Send some native tokens in your smart wallet to be able to resolve the error."

      expect(adviceFromRequest).toBe(adviceString)

      await expect(
        unfundedSmartAccountClient.sendTransaction({
          to: nftAddress,
          data: encodedCall
        })
      ).rejects.toThrow(adviceString)
    },
    50000
  )

  test.concurrent(
    "should fail with an incorrect nonce",
    async () => {
      const INCORRECT_NONCE = 1n
      const smartAccount = await signerToSmartAccount(publicClient, {
        signer: walletClientToSmartAccountSigner(fundedWalletClient)
      })

      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain,
        bundlerTransport: http(bundlerUrl)
      })

      const bundlerClient = createBundlerClient({
        chain,
        transport: http(bundlerUrl)
      })

      await expect(
        smartAccountClient.prepareUserOperationRequest({
          userOperation: {
            nonce: INCORRECT_NONCE,
            callData: await smartAccount.encodeCallData({
              to: zeroAddress,
              value: 0n,
              data: "0x1234"
            })
          }
        })
      ).rejects.toThrow("AA25: InvalidSmartAccountNonceError")
    },
    35000
  )
})
