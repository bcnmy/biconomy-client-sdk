import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  slice,
  toFunctionSelector
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient
} from "../../src/account"
import { createSessionKeyEOA } from "../../src/modules/session-storage/utils"
import {
  HardcodedReference,
  createABISessionDatum
} from "../../src/modules/sessions/abi"
import {
  createBatchSession,
  getBatchSessionTxParams
} from "../../src/modules/sessions/batch"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import type { CreateSessionDataParams } from "../../src/modules/utils/Types"
import { PaymasterMode } from "../../src/paymaster/utils/Types"
import { getConfig } from "../utils"

describe("Playground:Write", () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const preferredToken = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"

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

  const withSponsorship = {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED }
  }

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

  test("should quickly run a write test in the playground", async () => {
    const { sessionKeyAddress, sessionStorageClient } =
      await createSessionKeyEOA(smartAccount, chain)

    const maxUnit256Value =
      115792089237316195423570985008687907853269984665640564039457584007913129639935n
    const approval = parseAbi([
      "function approve(address spender, uint256 value) external returns (bool)"
    ])
    const safeMint = parseAbi([
      "function safeMint(address owner) view returns (uint balance)"
    ])

    console.log("approve", slice(toFunctionSelector(approval[0]), 0, 4))

    const leaves: CreateSessionDataParams[] = [
      createABISessionDatum({
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        contractAddress: preferredToken,
        functionSelector: approval[0],
        rules: [
          {
            offset: 0,
            condition: 0, // equal
            referenceValue: smartAccountAddress
          },
          {
            offset: 64,
            condition: 1, // less than or equal
            referenceValue: {
              raw: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            }
          }
        ],
        valueLimit: 0n
      }),
      createABISessionDatum({
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
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        valueLimit: 0n
      })
    ]

    const { wait } = await createBatchSession(
      smartAccount,
      sessionStorageClient,
      leaves
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const smartAccountWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddress, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId: chain.id
      },
      smartAccountAddress,
      true
    )

    const approvalTx = {
      to: preferredToken,
      data: encodeFunctionData({
        abi: approval,
        functionName: "approve",
        args: [smartAccountAddress, maxUnit256Value]
      })
    }

    const nftMintTx = {
      to: nftAddress,
      data: encodeFunctionData({
        abi: safeMint,
        functionName: "safeMint",
        args: [smartAccountAddress]
      })
    }

    const txs = [approvalTx, nftMintTx]

    console.log("approvalTx.data", approvalTx.data)

    const batchSessionParams = await getBatchSessionTxParams(
      [approvalTx, nftMintTx],
      [0, 1],
      smartAccountAddress,
      chain
    )

    console.log({ ...batchSessionParams.params })

    const { wait: waitForMint } = await smartAccountWithSession.sendTransaction(
      txs,
      {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20,
          preferredToken,
          skipPatchCallData: true // This omits the automatic patching of the call data with approvals
        },
        ...batchSessionParams
      }
    )
    const {
      receipt: { transactionHash: mintTxHash },
      userOpHash,
      success: mintSuccess
    } = await waitForMint()

    console.log({ mintSuccess })
  }, 60000)
})
