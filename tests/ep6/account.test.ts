import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  toHex,
  zeroAddress
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { waitForTransactionReceipt } from "viem/actions"
import type { UserOperationStruct } from "../../src/accounts/index.js"
import {
  validateUserOp,
  walletClientToSmartAccountSigner
} from "../../src/accounts/utils/helpers.js"
import { bundlerActions } from "../../src/client/decorators/bundler.js"
import {
  createSmartAccountClient,
  signerToNexus
} from "../../src/index.js"
import { checkBalance, getChainConfig } from "../utils.js"
import { K1_VALIDATOR_ADDRESS } from "../../src/accounts/utils/constants.js"

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
  let smartAccount: Awaited<ReturnType<typeof signerToNexus>>
  let smartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    smartAccount = await signerToNexus(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })

    smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })
  })

  test.concurrent("Should get the init code", async () => {
    const initCode = await smartAccount.getInitCode()
    expect(initCode).toBeDefined()
  })

  test.concurrent("Should get account address + nonce", async () => {
    const address = smartAccount.address
    expect(address).toBeDefined()
    const nonce = await smartAccount.getNonce()
    expect(nonce).toBeDefined()
  })

  test("Should send an empty tx", async () => {
    const txHash = await smartAccountClient.sendTransaction({
      to: "0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549",
      data: "0x1234"
    })

    const receipt = await waitForTransactionReceipt(publicClient, {
      hash: txHash
    })

    expect(receipt).toBeDefined()
    expect(txHash).toBeDefined()
  }, 50000)

  test("Should mint an NFT and pay for the gas", async () => {
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [smartAccount.address]
    })

    const txHash = await smartAccountClient.sendTransaction({
      to: nftAddress,
      data: encodedCall
    })

    const receipt = waitForTransactionReceipt(publicClient, { hash: txHash })

    expect(receipt).toBeDefined()
    expect(txHash).toBeDefined()
  }, 50000)

  test.concurrent(
    "Should build a user operation manually and validate it",
    async () => {
      const mintNftData = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [smartAccount.address]
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: zeroAddress,
            value: 0n,
            data: mintNftData
          })
        }
      })

      const isValid = validateUserOp(userOp)

      expect(isValid).toBe(true)
    },
    15000
  )

  test("Should send a batch of user ops", async () => {
    const encodedCall1 = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [smartAccount.address]
    })

    const encodedCall2 = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: ["0xfCF6Eb210E5Fd84D679b14fe170f9aB05C9B21e7"]
    })

    const balanceBefore1 = await checkBalance(
      publicClient,
      smartAccount.address,
      nftAddress
    )
    const balanceBefore2 = await checkBalance(
      publicClient,
      "0xfCF6Eb210E5Fd84D679b14fe170f9aB05C9B21e7",
      nftAddress
    )

    const txHash = await smartAccountClient.sendTransactions({
      transactions: [
        {
          to: nftAddress,
          data: encodedCall1,
          value: 0n
        },
        {
          to: nftAddress,
          data: encodedCall2,
          value: 0n
        }
      ]
    })

    const receipt = waitForTransactionReceipt(publicClient, { hash: txHash })

    expect(txHash).toBeDefined()

    const balanceAfter1 = await checkBalance(
      publicClient,
      smartAccount.address,
      nftAddress
    )
    const balanceAfter2 = await checkBalance(
      publicClient,
      "0xfCF6Eb210E5Fd84D679b14fe170f9aB05C9B21e7",
      nftAddress
    )

    expect(balanceAfter1).toBeGreaterThan(balanceBefore1)
    expect(balanceAfter2).toBeGreaterThan(balanceBefore2)
  }, 50000)

  test.concurrent("Should sign a user operation", async () => {
    const userOp: UserOperationStruct = {
      sender: "0x99F3Bc8058503960364Ef3fDBF6407C9b0BbefCc",
      nonce: toHex(0n),
      initCode:
        "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5df20ffbc0000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000242ede3bc0000000000000000000000000d3c85fdd3695aee3f0a12b3376acd8dc5402054900000000000000000000000000000000000000000000000000000000",
      callData:
        "0x0000189a000000000000000000000000463cd2b5e4f059265b9520ef878bda456d8a350600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000006442842e0e00000000000000000000000099f3bc8058503960364ef3fdbf6407c9b0bbefcc000000000000000000000000c7f0ea744e33fe599fb4d25ecb7440ccbc3cf9b2000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000",
      signature:
        "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32F37F5beA87BDD5374eB2aC54eA8e000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000",
      paymasterAndData: "0x",
      callGasLimit: toHex(0n),
      verificationGasLimit: toHex(0n),
      preVerificationGas: toHex(0n),
      maxFeePerGas: toHex(0n),
      maxPriorityFeePerGas: toHex(0n)
    }

    const sig = await smartAccount.signUserOperation(userOp)
    expect(sig).toBeDefined()
  })

  test.concurrent("Client signMessage", async () => {
    const response = await smartAccount.signMessage({
      message: "hello world"
    })

    expect(response).toBeTypeOf("string")
    expect(response).toHaveLength(386)
  })

  test.concurrent(
    "smart account should have ECDSA as default & active validation module",
    async () => {
      const defaultValidationModule = smartAccount.defaultValidationModule
      const activeValidationModule = smartAccount.activeValidationModule
      expect(defaultValidationModule.getModuleAddress()).toBe(
        K1_VALIDATOR_ADDRESS
      )
      expect(activeValidationModule.getModuleAddress()).toBe(
        K1_VALIDATOR_ADDRESS
      )
    }
  )

  test.concurrent("should check active module", async () => {
    const activeValidationModule = smartAccount.activeValidationModule
    const signer = await activeValidationModule.getSigner()
    expect(signer.address).toEqual(walletClient.account?.address)
  })

  test.concurrent("Smart account client signTypedData", async () => {
    const response = await smartAccount.signTypedData({
      domain: {
        chainId: 1,
        name: "Test",
        verifyingContract: zeroAddress
      },
      primaryType: "Test",
      types: {
        Test: [
          {
            name: "test",
            type: "string"
          }
        ]
      },
      message: {
        test: "hello world"
      }
    })

    expect(response).toBeTypeOf("string")
    expect(response).toHaveLength(386)
  })

  test.concurrent(
    "should throw with custom error SignTransactionNotSupportedBySmartAccount",
    async () => {
      const response = smartAccount.signTransaction({
        to: zeroAddress,
        value: 0n,
        data: "0x"
      })
      expect(response).rejects.toThrow(
        "Sign transaction not supported by smart account"
      )
    }
  )

  test.concurrent(
    "Should build a user operation manually and send it",
    async () => {
      const mintNftData = encodeFunctionData({
        abi: parseAbi(["function safeMint(address to) public"]),
        functionName: "safeMint",
        args: [smartAccount.address]
      })

      const userOp = await smartAccountClient.prepareUserOperationRequest({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData({
            to: zeroAddress,
            value: 0n,
            data: mintNftData
          })
        }
      })

      const isValid = validateUserOp(userOp)

      expect(isValid).toBe(true)

      const userOpHash = await smartAccountClient.sendUserOperation({
        userOperation: userOp
      })

      const receipt = await smartAccountClient
        .extend(bundlerActions())
        .waitForUserOperationReceipt({ hash: userOpHash })

      expect(receipt).toBeDefined()
      expect(userOpHash).toBeDefined()
    },
    50000
  )
})
