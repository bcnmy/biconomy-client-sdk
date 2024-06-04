import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  createPublicClient,
  createWalletClient,
  zeroAddress,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { waitForTransactionReceipt } from "viem/actions"
import {
  walletClientToSmartAccountSigner
} from "../../src/accounts/utils/helpers.js"
import {
  createSmartAccountClient, getSenderAddress, signerToNexus,
} from "../../src/index.js"
import { getChainConfig } from "../utils.js"

describe("Biconomy Smart Account V2 EP v6 tests", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let nexusAccount: Awaited<ReturnType<typeof signerToNexus>>
  let smartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    nexusAccount = await signerToNexus(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })

    smartAccountClient = createSmartAccountClient({
      account: nexusAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })
  })

  test("Should throw on signTransaction", async() => {
    console.log("account address ", nexusAccount.address)

    expect(nexusAccount.address).toHaveLength(42)
    expect(nexusAccount.address).toMatch(/^0x[0-9a-fA-F]{40}$/)

    await expect(nexusAccount.signTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })
    ).rejects.toThrow("Sign transaction not supported by smart account");
  })

  test("Should sign a message with smartAccountClient", async() => {
    const message = "hello world";
    const response = await nexusAccount.signMessage({message});
    console.log("response", response);
    console.log(response.length, "response length");
    
    expect(response).toHaveLength(132)
    expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
  })

  // test("verifySignature with signTypedData", async () => {
  //   const initialEcdsaSmartAccount = await signerToV3SmartAccount(publicClient, {
  //     signer: walletClientToSmartAccountSigner(walletClient)
  //   })

  //   const smartAccountClient = createSmartAccountClient({
  //     account: initialEcdsaSmartAccount,
  //     chain,
  //     bundlerTransport: http(bundlerUrl)
  //   })

  //   const signature = await smartAccountClient.signTypedData({
  //     domain: {
  //       name: "Ether Mail",
  //       version: "1",
  //       chainId: 1,
  //       verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  //     },
  //     types: {
  //       Person: [
  //         { name: "name", type: "string" },
  //         { name: "wallet", type: "address" }
  //       ],
  //       Mail: [
  //         { name: "from", type: "Person" },
  //         { name: "to", type: "Person" },
  //         { name: "contents", type: "string" }
  //       ]
  //     },
  //     primaryType: "Mail",
  //     message: {
  //       from: {
  //         name: "Cow",
  //         wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  //       },
  //       to: {
  //         name: "Bob",
  //         wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  //       },
  //       contents: "Hello, Bob!"
  //     }
  //   })

  //   const isVerified = await publicClient.verifyTypedData({
  //     address: smartAccountClient.account.address,
  //     domain: {
  //       name: "Ether Mail",
  //       version: "1",
  //       chainId: 1,
  //       verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  //     },
  //     types: {
  //       Person: [
  //         { name: "name", type: "string" },
  //         { name: "wallet", type: "address" }
  //       ],
  //       Mail: [
  //         { name: "from", type: "Person" },
  //         { name: "to", type: "Person" },
  //         { name: "contents", type: "string" }
  //       ]
  //     },
  //     primaryType: "Mail",
  //     message: {
  //       from: {
  //         name: "Cow",
  //         wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  //       },
  //       to: {
  //         name: "Bob",
  //         wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  //       },
  //       contents: "Hello, Bob!"
  //     },
  //     signature
  //   })

  //   expect(isVerified).toBeTruthy()
  // }, 50000)

  // test("Should verifySignature of not deployed", async () => {
  //   const initialEcdsaSmartAccount = await signerToV3SmartAccount(publicClient, {
  //     signer: walletClientToSmartAccountSigner(walletClient),
  //     index: 1000n
  //   })

  //   const smartAccountClient = createSmartAccountClient({
  //     account: initialEcdsaSmartAccount,
  //     chain,
  //     bundlerTransport: http(bundlerUrl)
  //   })

  //   const message = "hello world"

  //   const signature = await smartAccountClient.signMessage({
  //     message
  //   })

  //   const isVerified = await publicClient.verifyMessage({
  //     address: smartAccountClient.account.address,
  //     message,
  //     signature
  //   })

  //   console.log("isVerified", isVerified);
    
  //   expect(isVerified).toBeTruthy()
  // }, 50000)
})
