import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  Hex,
  createPublicClient,
  createWalletClient,
  toHex,
  zeroAddress
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { waitForTransactionReceipt } from "viem/actions"
import { sepolia } from "viem/chains"
import { signerToNexus } from "../../src/accounts/index.js"
import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers.js"
import { createSmartAccountClient } from "../../src/client/createSmartAccountClient.js"

describe("Biconomy Smart Account V2 EP v6 tests", () => {
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const bundlerUrl =
    "https://api.pimlico.io/v2/11155111/rpc?apikey=22c48af7-4886-4c7d-8d4c-5d50262a23f3"
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http()
  })
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })
  let smartAccount: Awaited<ReturnType<typeof signerToNexus>>
  let smartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    smartAccount = await signerToNexus(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient),
      modules: {
        validators: [],
        executors: [],
        hook: "0x",
        fallbacks: []
      }
    })

    smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain: sepolia,
      bundlerTransport: http(bundlerUrl)
    })
  })

  test("Get init code", async () => {
    const initCode = await smartAccount.getInitCode()
    expect(initCode).toBeDefined()
  }, 50000)

  test("Should get account address + nonce", async () => {
    const address = smartAccountClient.account.address
    expect(address).not.toEqual(zeroAddress)
    const nonce = await smartAccount.getNonce()
    expect(nonce).toBeDefined()
  })

  test("Should throw on signTransaction", async () => {
    console.log("account address ", smartAccount.address)

    expect(smartAccount.address).toHaveLength(42)
    expect(smartAccount.address).toMatch(/^0x[0-9a-fA-F]{40}$/)

    await expect(
      smartAccount.signTransaction({
        to: zeroAddress,
        value: 0n,
        data: "0x"
      })
    ).rejects.toThrow("Sign transaction not supported by smart account")
  })

  test("Should sign a user operation", async () => {
    const userOp = {
      sender: "0xa41C33AB9abEb988928cE454e612E8069BCc9D59",
      nonce: "0xe",
      callData: "0x",
      initCode: "0x",
      paymasterAndData: "0x",
      callGasLimit: "0x2a66d",
      verificationGasLimit: "0xda71",
      preVerificationGas: "0xba55f8",
      maxFeePerGas: "0xf4460",
      maxPriorityFeePerGas: "0xf4240",
      signature:
        "0xb19a2d3b1cfc16311f53dd888105a6d9c28e94cbdcfc93a6c66c695bbdd7ef87183faddc8cc455533878437e847435a70a866fba0d629f46bc06dd97e9f2f6471b"
    }

    const signedUserOp = await smartAccount.signUserOperation(userOp)
    expect(signedUserOp).toBeDefined()
  })

  // test("Should send an empty tx", async () => {

  //   const nonce = await smartAccount.getNonce();
  //   console.log(nonce, "nonce");

  //   const userOp = {
  //     sender: "0xa41C33AB9abEb988928cE454e612E8069BCc9D59" as Hex,
  //     nonce: nonce,
  //     callData:"0x" as Hex,
  //     initCode: undefined,
  //     callGasLimit: BigInt(100000),
  //     verificationGasLimit: BigInt(116831),
  //     preVerificationGas: BigInt(116831),
  //     maxFeePerGas: BigInt(2929315522),
  //     maxPriorityFeePerGas:BigInt(588736768),
  //     signature:"0xb19a2d3b1cfc16311f53dd888105a6d9c28e94cbdcfc93a6c66c695bbdd7ef87183faddc8cc455533878437e847435a70a866fba0d629f46bc06dd97e9f2f6471b" as Hex
  //   };

  //   const txHash = await smartAccountClient.sendUserOperation({userOperation: userOp})

  //   const receipt = await waitForTransactionReceipt(publicClient, {
  //     hash: txHash
  //   })

  //   expect(receipt).toBeDefined()
  //   expect(txHash).toBeDefined()
  // }, 50000)
})
