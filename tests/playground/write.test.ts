import {
  http,
  type Hex,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type Transaction,
  createSmartAccountClient
} from "../../src/account"
import {
  type PolicyWithoutSessionKey,
  createDistributedSession,
  getDanSessionTxParams
} from "../../src/modules/sessions/dan"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getConfig } from "../utils"

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED }
}

describe("Playground:Write", () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
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

  let [smartAccount, smartAccountTwo]: BiconomySmartAccountV2[] = []
  let [smartAccountAddress, smartAccountAddressTwo]: Hex[] = []

  const [walletClient, walletClientTwo, walletClientRandom] = [
    createWalletClient({
      account,
      chain,
      transport: http()
    }),
    createWalletClient({
      account: accountTwo,
      chain,
      transport: http()
    }),
    createWalletClient({
      account: privateKeyToAccount(generatePrivateKey()),
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

  test("should create and use a DAN session on behalf of a user", async () => {
    const policy: PolicyWithoutSessionKey[] = [
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
    ]

    const { wait, session } = await createDistributedSession(
      smartAccount,
      policy
    )

    const { success } = await wait()
    expect(success).toBe("true")

    const nftMintTx: Transaction = {
      to: nftAddress,
      data: encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [smartAccountAddress]
      })
    }

    const nftBalanceBefore = await checkBalance(smartAccountAddress, nftAddress)

    console.log("1", session)

    const smartAccountWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddress, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      session,
      "DAN"
    )

    const { wait: waitForMint } =
      await smartAccountWithSession.sendSessionTransaction(
        [session, chain, null],
        nftMintTx,
        withSponsorship
      )

    const { success: mintSuccess } = await waitForMint()

    expect(mintSuccess).toBe("true")

    const nftBalanceAfter = await checkBalance(smartAccountAddress, nftAddress)
    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  }, 50000)
})
