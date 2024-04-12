import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import {
  http,
  type Chain,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  hashMessage,
  parseAbi,
  parseAbiParameters
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { bsc } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ERROR_MESSAGES,
  NATIVE_TOKEN_ALIAS,
  compareChainIds,
  createSmartAccountClient
} from "../../src/account"
import { type UserOperationStruct, getChain } from "../../src/account"
import { BiconomyAccountAbi } from "../../src/account/abi/SmartAccount"
import { createBundler } from "../../src/bundler"
import {
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  createECDSAOwnershipValidationModule
} from "../../src/modules"
import {
  type FeeQuotesOrDataResponse,
  Paymaster,
  PaymasterMode
} from "../../src/paymaster"
import { checkBalance, getBundlerUrl, getConfig } from "../utils"

describe("Paymaster: Read", () => {
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
  })

  test.concurrent(
    "should expect several feeQuotes in resonse to empty tokenInfo fields",
    async () => {
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
        paymasterServiceData: { mode: PaymasterMode.ERC20 }
      })

      expect(feeQuotesResponse.feeQuotes?.length).toBeGreaterThan(1)
    }
  )

  test.concurrent(
    "should get supported tokens from the paymaster",
    async () => {
      const tokens = await smartAccount.getSupportedTokens()

      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens[0]).toHaveProperty("tokenAddress")
      expect(tokens[0]).toHaveProperty("symbol")
      expect(tokens[0]).toHaveProperty("decimal")
      expect(tokens[0]).toHaveProperty("premiumPercentage")
      expect(tokens[0]).toHaveProperty("logoUrl")
    },
    60000
  )

  test.concurrent(
    "should throw and error if missing field for ERC20 Paymaster user op",
    async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })

      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }

      const feeQuotesResponse: FeeQuotesOrDataResponse =
        await smartAccount.getTokenFees(transaction, {
          paymasterServiceData: {
            mode: PaymasterMode.ERC20,
            preferredToken: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
          }
        })

      expect(async () =>
        smartAccount.sendTransaction(transaction, {
          paymasterServiceData: {
            mode: PaymasterMode.ERC20,
            feeQuote: feeQuotesResponse.feeQuotes?.[0]
          },
          simulationType: "validation"
        })
      ).rejects.toThrow(ERROR_MESSAGES.SPENDER_REQUIRED)
    },
    60000
  )
})
