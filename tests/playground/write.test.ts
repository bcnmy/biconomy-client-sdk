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
import { createDANSessionKeyManagerModule } from "../../src/modules/index"
import {
  createSessionKeyEOA,
  getDefaultStorageClient
} from "../../src/modules/session-storage/utils"
import {
  createDecentralisedSession,
  getDANSessionKey
} from "../../src/modules/sessions/dan"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { hexToUint8Array } from "../../src/modules/utils/Helper"
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

  test("should create and use a DAN session on behalf of a user", async () => {
    const { sessionStorageClient, sessionKeyAddress } =
      await createSessionKeyEOA(smartAccount, chain)

    const { wait, session } = await createDecentralisedSession(
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

    const nftMintTx = {
      to: nftAddress,
      data: encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [smartAccountAddress]
      })
    }

    const nftBalanceBefore = await checkBalance(smartAccountAddress, nftAddress)

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const sk = hexToUint8Array(process.env.EPHEMERAL_KEY!)

    const unusedSessionKey = (
      await session.sessionStorageClient.getSessionData({
        sessionID: session.sessionIDInfo[0]
      })
    ).sessionPublicKey

    const sessionModule = await createDANSessionKeyManagerModule({
      smartAccountAddress,
      sessionStorageClient
    })

    smartAccount.setActiveValidationModule(sessionModule)

    const sessionID = session.sessionIDInfo[0]

    const { wait: mintWait } = await smartAccount.sendTransaction(nftMintTx, {
      ...withSponsorship,
      params: {
        scwAddress: smartAccountAddress,
        eoaAddress: walletClient.account.address,
        ephSK: sk,
        threshold: 11,
        partiesNumber: 20,
        sessionID,
        chainId: 80002,
        mpcKeyId: session.keyId
      }
    })
    const { success: mintSuccess } = await mintWait()

    expect(mintSuccess).toBe("true")

    const nftBalanceAfter = await checkBalance(smartAccountAddress, nftAddress)
    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)

    console.log({ transactionHash, success, mintSuccess })
  }, 50000)
})
