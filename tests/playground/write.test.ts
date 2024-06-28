import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient
} from "../../src/account"
import { createSessionKeyEOA } from "../../src/modules/session-storage/utils"
import { createDecentralisedSession } from "../../src/modules/sessions/dan"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getConfig } from "../utils"

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED }
}

describe("Playground:Write", () => {
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

  test("should create a DAN session on behalf of a user", async () => {
    const { sessionStorageClient } = await createSessionKeyEOA(
      smartAccount,
      chain
    )

    const { wait } = await createDecentralisedSession(
      smartAccount,
      chain,
      [
        {
          contractAddress: nftAddress,
          functionSelector: "safeMint(address)",
          rules: [
            {
              offset: 0,
              condition: 0,
              referenceValue: smartAccountAddress
            }
          ],
          interval: {
            validUntil: 0,
            validAfter: 0
          },
          valueLimit: 0n
        }
      ],
      sessionStorageClient,
      withSponsorship
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")
  }, 50000)

  // User no longer has to be connected,
  // Only the reference to the relevant sessionID and the store from the previous step is needed to execute txs on the user's behalf
  test.skip("should use the DAN session to mint an NFT for the user", async () => {
    // Assume the real signer for userSmartAccount is no longer available (ie. user has logged out)
    const smartAccountWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddress, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      smartAccountAddress // Storage client, full Session or smartAccount address if using default storage
    )

    const sessionSmartAccountAddress =
      await smartAccountWithSession.getAccountAddress()

    expect(sessionSmartAccountAddress).toEqual(smartAccountAddress)

    const nftMintTx = {
      to: nftAddress,
      data: encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [smartAccountAddress]
      })
    }

    const nftBalanceBefore = await checkBalance(smartAccountAddress, nftAddress)

    const { wait } = await smartAccountWithSession.sendTransaction(nftMintTx, {
      ...withSponsorship
    })

    const { success } = await wait()

    expect(success).toBe("true")

    const nftBalanceAfter = await checkBalance(smartAccountAddress, nftAddress)

    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  })
})
