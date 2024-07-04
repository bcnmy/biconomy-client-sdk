import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  parseUnits
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  Logger,
  type Transaction,
  createSmartAccountClient,
  getChain
} from "../../src/account"
import { checkBalance, getConfig } from "../utils"

import {
  type CreateSessionDataParams,
  SessionMemoryStorage,
  createABISessionDatum,
  createBatchSession,
  createERC20SessionDatum,
  createSessionSmartAccountClient,
  getBatchSessionTxParams
} from "../../src/modules"
import type { ISessionStorage } from "../../src/modules/interfaces/ISessionStorage"
import { createSessionKeyEOA } from "../../src/modules/session-storage/utils"
import { PaymasterMode } from "../../src/paymaster"

describe("Playground:Write", async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const withSponsorship = {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED }
  }
  const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl,
    paymasterUrlTwo
  } = getConfig()

  const chainBase = getChain(84532)
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
  const amount = parseUnits(".0001", 6)
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

  let sessionStorageClient: ISessionStorage

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

    sessionStorageClient = new SessionMemoryStorage(smartAccountAddress)
  })

  test("should create a batch session on behalf of a user", async () => {
    const { sessionKeyAddress } = await createSessionKeyEOA(
      smartAccount,
      chain,
      sessionStorageClient
    )

    const leaves: CreateSessionDataParams[] = [
      createERC20SessionDatum({
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        sessionKeyData: encodeAbiParameters(
          [
            { type: "address" },
            { type: "address" },
            { type: "address" },
            { type: "uint256" }
          ],
          [sessionKeyAddress, token, recipient, amount]
        )
      }),
      createABISessionDatum({
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        contractAddress: nftAddress,
        functionSelector: "safeMint(address)",
        rules: [
          {
            offset: 0,
            condition: 0,
            referenceValue: smartAccountAddress
          }
        ],
        valueLimit: 0n
      })
    ]

    const { wait, session } = await createBatchSession(
      smartAccount,
      sessionStorageClient,
      leaves,
      withSponsorship
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")

    Logger.log("Tx Hash: ", transactionHash)
    Logger.log("session: ", { session })
  }, 50000)

  // User no longer has to be connected,
  // Only the reference to the relevant sessionID and the store from the previous step is needed to execute txs on the user's behalf
  test("should use the batch session to mint an NFT, and pay some token for the user", async () => {
    console.log({ sessionStorageClient })

    // Assume the real signer for userSmartAccount is no longer available (ie. user has logged out);
    const smartAccountWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddress, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      sessionStorageClient,
      true // if batching
    )

    const transferTx: Transaction = {
      to: token,
      data: encodeFunctionData({
        abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
        functionName: "transfer",
        args: [recipient, amount]
      })
    }
    const nftMintTx: Transaction = {
      to: nftAddress,
      data: encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [smartAccountAddress]
      })
    }

    const nftBalanceBefore = await checkBalance(smartAccountAddress, nftAddress)
    const tokenBalanceBefore = await checkBalance(recipient, token)

    const txs = [transferTx, nftMintTx]

    const batchSessionParams = await getBatchSessionTxParams(
      txs,
      [0, 1],
      sessionStorageClient,
      chain
    )

    const { wait } = await smartAccountWithSession.sendTransaction(txs, {
      ...batchSessionParams,
      ...withSponsorship
    })
    const { success } = await wait()
    expect(success).toBe("true")

    const tokenBalanceAfter = await checkBalance(recipient, token)
    const nftBalanceAfter = await checkBalance(smartAccountAddress, nftAddress)
    expect(tokenBalanceAfter - tokenBalanceBefore).toBe(amount)
    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  }, 50000)
})
