import { http, createPublicClient, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"

import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers.js"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"
import { getChainConfig } from "../utils.js"

describe("Biconomy Smart Account V2 EP v6 - Signature tests", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let smartAccount: Awaited<ReturnType<typeof signerToSmartAccount>>
  let smartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    smartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })

    smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })
  })

  test("verifySignature of deployed", async () => {
    const message = "hello world"

    const signature = await smartAccountClient.signMessage({
      message
    })

    console.log("signature", signature);
    console.log(signature.length, "signature length");
    
    const isVerified = await publicClient.verifyMessage({
      address: smartAccountClient.account.address,
      message,
      signature
    })

    expect(isVerified).toBeTruthy()
  })

  test("should fail because no account", async () => {
    const newSmartAccountClient = createSmartAccountClient({
      account: undefined,
      chain,
      bundlerTransport: http(bundlerUrl)
    })

    const message = "hello world"

    const signature = newSmartAccountClient.signMessage({
      message
    })

    expect(signature).rejects.toThrow()
  })

  test("verifySignature of not deployed", async () => {
    const initialEcdsaSmartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient),
      index: 10000n
    })

    const smartAccountClient = createSmartAccountClient({
      account: initialEcdsaSmartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })

    const message = "hello world"

    const signature = await smartAccountClient.signMessage({
      message
    })

    const isVerified = await publicClient.verifyMessage({
      address: smartAccountClient.account.address,
      message,
      signature
    })

    expect(isVerified).toBeTruthy()
  })

  test("verifySignature with signTypedData", async () => {
    const initialEcdsaSmartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })

    const smartAccountClient = createSmartAccountClient({
      account: initialEcdsaSmartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })

    const signature = await smartAccountClient.signTypedData({
      domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
      },
      types: {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" }
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person" },
          { name: "contents", type: "string" }
        ]
      },
      primaryType: "Mail",
      message: {
        from: {
          name: "Cow",
          wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
        },
        to: {
          name: "Bob",
          wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
        },
        contents: "Hello, Bob!"
      }
    })

    const isVerified = await publicClient.verifyTypedData({
      address: smartAccountClient.account.address,
      domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
      },
      types: {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" }
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person" },
          { name: "contents", type: "string" }
        ]
      },
      primaryType: "Mail",
      message: {
        from: {
          name: "Cow",
          wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
        },
        to: {
          name: "Bob",
          wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
        },
        contents: "Hello, Bob!"
      },
      signature
    })

    expect(isVerified).toBeTruthy()
  })

  test(
    "verifySignature with signTypedData for not deployed",
    async () => {
      const initialEcdsaSmartAccount = await signerToSmartAccount(
        publicClient,
        {
          signer: walletClientToSmartAccountSigner(walletClient)
        }
      )

      const smartAccountClient = createSmartAccountClient({
        account: initialEcdsaSmartAccount,
        chain,
        bundlerTransport: http(bundlerUrl)
      })

      const signature = await smartAccountClient.signTypedData({
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        },
        types: {
          Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
          ],
          Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
          ]
        },
        primaryType: "Mail",
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          contents: "Hello, Bob!"
        }
      })

      const isVerified = await publicClient.verifyTypedData({
        address: smartAccountClient.account.address,
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        },
        types: {
          Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
          ],
          Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
          ]
        },
        primaryType: "Mail",
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          contents: "Hello, Bob!"
        },
        signature
      })

      expect(isVerified).toBeTruthy()
    }
  )
})
