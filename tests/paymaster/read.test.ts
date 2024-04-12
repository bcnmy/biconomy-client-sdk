import {
  http,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  type Hex
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  ERROR_MESSAGES,
  createSmartAccountClient
} from "../../src/account"
import {
  type FeeQuotesOrDataResponse,
  PaymasterMode
} from "../../src/paymaster"
import { getConfig } from "../utils"

describe.skip("Paymaster: Read", () => {
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
