import { http, createPublicClient, createWalletClient, zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect, test } from "vitest"
import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers.js"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"
import { testForBaseSopelia } from "../setupFiles.js"
import { getChainConfig } from "../utils.js"

describe("Bundler tests", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const walletClient = createWalletClient({
    account: account,
    chain,
    transport: http()
  })
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const bundlerClient = createBundlerClient({
    chain,
    transport: http(bundlerUrl)
  })

  test.concurrent("Should have the properties of a viem client", async () => {
    expect(bundlerClient.uid).toBeDefined()
    expect(bundlerClient?.chain?.id).toBe(chain.id)
    expect(bundlerClient.pollingInterval).toBeDefined()
  })

  test.concurrent("Should have a bundler specific action", async () => {
    expect(await bundlerClient.chainId()).toBe(chain.id)
  })

  testForBaseSopelia.concurrent(
    "Should get user op status",
    async () => {
      const userOpHash =
        "0xebea403d4701fe950c4fe4aeb117e457a930b843238430b9cc8c3cf502bb2cb0"

      const status = await bundlerClient.getUserOpStatus(userOpHash)
      expect(status).toBeDefined()
      expect(status.state).toBeDefined()
      expect(status.transactionHash).toBeDefined()
      expect(status.userOperationReceipt).toBeDefined()
    },
    35000
  )

  test.concurrent(
    "Should get user op receipt",
    async () => {
      const userOpHash =
        "0xebea403d4701fe950c4fe4aeb117e457a930b843238430b9cc8c3cf502bb2cb0"

      const receipt = await bundlerClient.getUserOperationReceipt({
        hash: userOpHash
      })
      expect(receipt).toBeDefined()
    },
    35000
  )

  test("Should send a user operation using the bundler client and wait for receipt", async () => {
    const smartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })

    const userOp = await smartAccountClient.prepareUserOperationRequest({
      userOperation: {
        callData: await smartAccount.encodeCallData({
          to: zeroAddress,
          value: 0n,
          data: "0x1234"
        })
      }
    })

    // need to sign the userOp before sending test if we use "bundlerClient.sendUserOperation" directly
    userOp.signature = await smartAccount.signUserOperation(userOp)

    const newUserOpHash = await bundlerClient.sendUserOperation({
      userOperation: userOp
    })

    expect(newUserOpHash).toBeDefined()

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: newUserOpHash
    })

    expect(receipt).toBeDefined()
  }, 35000)
})
