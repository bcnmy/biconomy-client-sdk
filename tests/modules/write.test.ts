import {
  http,
  type Hex,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  pad,
  parseAbi,
  parseUnits
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type Transaction,
  createSmartAccountClient
} from "../../src/account"
import { Logger, getChain } from "../../src/account"
import {
  type CreateSessionDataParams,
  DEFAULT_ABI_SVM_MODULE,
  DEFAULT_ERC20_MODULE,
  DEFAULT_MULTICHAIN_MODULE,
  createMultiChainValidationModule
} from "../../src/modules"

import { SessionMemoryStorage } from "../../src/modules/session-storage/SessionMemoryStorage"
import { createAndStoreNewSessionKey } from "../../src/modules/session-storage/utils"
import {
  createABISessionDatum,
  createSession
} from "../../src/modules/sessions/abi"
import { createERC20SessionDatum } from "../../src/modules/sessions/erc20"
import {
  createMultiSession,
  getMultiSessionTxParams
} from "../../src/modules/sessions/multi"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getBundlerUrl, getConfig, topUp } from "../utils"

describe("Modules:Write", () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
  const amount = parseUnits(".0001", 6)

  const withSponsorship = {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED }
  }
  let storeForSingleSession: SessionMemoryStorage
  let storeForMultiSession: SessionMemoryStorage

  const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl,
    paymasterUrlTwo
  } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

  let [
    smartAccount,
    smartAccountTwo,
    smartAccountThree,
    smartAccountFour
  ]: BiconomySmartAccountV2[] = []
  let [
    smartAccountAddress,
    smartAccountAddressTwo,
    smartAccountAddressThree,
    smartAccountAddressFour
  ]: Hex[] = []

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

  const recipient = walletClientTwo.account.address

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

    // Same user as smartAccount, but different smart account
    smartAccountThree = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      paymasterUrl,
      index: 7
    })

    smartAccountFour = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      paymasterUrl,
      index: 6
    })

    smartAccountAddressThree = await smartAccountThree.getAccountAddress()
    smartAccountAddressFour = await smartAccountFour.getAccountAddress()
    storeForSingleSession = new SessionMemoryStorage(smartAccountAddressThree) // Set the session storage client with the smart account address
    storeForMultiSession = new SessionMemoryStorage(smartAccountAddressFour) // Set the session storage client with the smart account address

    await Promise.all([
      topUp(smartAccountAddress, undefined, token),
      topUp(smartAccountAddress, undefined),
      topUp(smartAccountAddressTwo, undefined, token),
      topUp(smartAccountAddressTwo, undefined),
      topUp(smartAccountAddressThree, undefined, token),
      topUp(smartAccountAddressThree, undefined),
      topUp(smartAccountAddressFour, undefined, token),
      topUp(smartAccountAddressFour, undefined)
    ])
  })

  // User must be connected with a wallet to grant permissions
  test("should create a single session on behalf of a user", async () => {
    const { sessionKeyAddress } = await createAndStoreNewSessionKey(
      smartAccountThree,
      chain,
      storeForSingleSession
    )

    const { wait, session } = await createSession(
      smartAccountThree,
      [
        {
          sessionKeyAddress,
          contractAddress: nftAddress,
          functionSelector: "safeMint(address)",
          rules: [
            {
              offset: 0,
              condition: 0,
              referenceValue: pad(smartAccountAddressThree, { size: 32 })
            }
          ],
          interval: {
            validUntil: 0,
            validAfter: 0
          },
          valueLimit: 0n
        }
      ],
      sessionKeyAddress,
      storeForSingleSession,
      withSponsorship
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")
    expect(session.sessionID).toBeTruthy()
    Logger.log("Tx Hash: ", transactionHash)
  }, 50000)

  // User no longer has to be connected,
  // Only the reference to the relevant sessionID and the store from the previous step is needed to execute txs on the user's behalf
  test("should use the session to mint an NFT for the user", async () => {
    // Setup
    const sessions = await storeForSingleSession.getAllSessionData()
    const sessionID = sessions?.[0]?.sessionID as string // Same sessionID as returned from the previous test
    expect(sessionID).toBeTruthy() // Should have been set in the previous test

    // Assume the real signer for userSmartAccountThree is no longer available (ie. user has logged out)
    const smartAccountThreeWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddressThree, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      {
        sessionStorageClient: storeForSingleSession,
        sessionID
      }
    )

    const sessionSmartAccountThreeAddress =
      await smartAccountThreeWithSession.getAccountAddress()

    expect(sessionSmartAccountThreeAddress).toEqual(smartAccountAddressThree)

    const nftMintTx = {
      to: nftAddress,
      data: encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [smartAccountAddressThree]
      })
    }

    const nftBalanceBefore = await checkBalance(
      smartAccountAddressThree,
      nftAddress
    )

    const { wait } = await smartAccountThreeWithSession.sendTransaction(
      nftMintTx,
      withSponsorship
    )

    const { success } = await wait()

    expect(success).toBe("true")

    const nftBalanceAfter = await checkBalance(
      smartAccountAddressThree,
      nftAddress
    )

    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  })

  // User must be connected with a wallet to grant permissions
  test("should create a multi session on behalf of a user", async () => {
    const { sessionKeyAddress } = await createAndStoreNewSessionKey(
      smartAccountFour,
      chain,
      storeForMultiSession
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
            referenceValue: pad(smartAccountAddressFour, { size: 32 })
          }
        ],
        valueLimit: 0n
      })
    ]

    const { wait, session } = await createMultiSession(
      smartAccountFour,
      sessionKeyAddress,
      storeForMultiSession,
      leaves,
      withSponsorship
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")
    expect(session.sessionID).toBeTruthy()
    Logger.log("Tx Hash: ", transactionHash)
    Logger.log("session: ", { session })
  }, 50000)

  // User no longer has to be connected,
  // Only the reference to the relevant sessionID and the store from the previous step is needed to execute txs on the user's behalf
  test("should use the multi session to mint an NFT, and pay some token for the user", async () => {
    // Setup
    const sessions = await storeForMultiSession.getAllSessionData()
    const sessionID = sessions?.[0]?.sessionID as string // Same sessionID as returned from the previous test
    const sessionSigner = await storeForMultiSession.getSignerBySession(chain, {
      sessionID
    })

    expect(sessionID).toBeTruthy() // Should have been set in the previous test

    // Assume the real signer for userSmartAccountFour is no longer available (ie. user has logged out);
    const smartAccountFourWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddressFour, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      {
        sessionStorageClient: storeForMultiSession,
        sessionID
      },
      true // if batching
    )

    const sessionSmartAccountFourAddress =
      await smartAccountFourWithSession.getAccountAddress()

    expect(sessionSmartAccountFourAddress).toEqual(smartAccountAddressFour)

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
        args: [smartAccountAddressFour]
      })
    }

    const nftBalanceBefore = await checkBalance(
      smartAccountAddressFour,
      nftAddress
    )
    const tokenBalanceBefore = await checkBalance(recipient, token)

    const batchSessionParams = await getMultiSessionTxParams(
      ["ERC20", "ABI"],
      storeForMultiSession,
      sessionID,
      chain
    )

    const { wait } = await smartAccountFourWithSession.sendTransaction(
      [transferTx, nftMintTx],
      {
        ...batchSessionParams,
        ...withSponsorship
      }
    )
    const { success } = await wait()
    expect(success).toBe("true")

    const tokenBalanceAfter = await checkBalance(recipient, token)
    const nftBalanceAfter = await checkBalance(
      smartAccountAddressFour,
      nftAddress
    )
    expect(tokenBalanceAfter - tokenBalanceBefore).toBe(amount)
    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  })

  test("should use MultichainValidationModule to mint an NFT on two chains with sponsorship", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"

    const chainIdBase = 84532
    const bundlerUrlBase = getBundlerUrl(chainIdBase)

    const signerBase = createWalletClient({
      account: privateKeyToAccount(`0x${privateKey}`),
      chain: getChain(84532),
      transport: http()
    })

    const paymasterUrlBase = paymasterUrlTwo

    const multiChainModule = await createMultiChainValidationModule({
      signer: walletClient,
      moduleAddress: DEFAULT_MULTICHAIN_MODULE
    })

    const [polygonAccount, baseAccount] = await Promise.all([
      createSmartAccountClient({
        chainId,
        signer: walletClient,
        bundlerUrl,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule,
        paymasterUrl
      }),
      createSmartAccountClient({
        chainId: chainIdBase,
        signer: signerBase,
        bundlerUrl: bundlerUrlBase,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule,
        paymasterUrl: paymasterUrlBase
      })
    ])

    // Check if the smart account has been deployed
    const [isPolygonDeployed, isBaseDeployed] = await Promise.all([
      polygonAccount.isAccountDeployed(),
      baseAccount.isAccountDeployed()
    ])
    if (!isPolygonDeployed) {
      const { wait } = await polygonAccount.deploy(withSponsorship)
      const { success } = await wait()
      expect(success).toBe("true")
    }
    if (!isBaseDeployed) {
      const { wait } = await baseAccount.deploy(withSponsorship)
      const { success } = await wait()
      expect(success).toBe("true")
    }

    const moduleEnabled1 = await polygonAccount.isModuleEnabled(
      DEFAULT_MULTICHAIN_MODULE
    )
    const moduleActive1 = polygonAccount.activeValidationModule
    expect(moduleEnabled1).toBeTruthy()
    expect(moduleActive1.getAddress()).toBe(DEFAULT_MULTICHAIN_MODULE)

    const moduleEnabled2 = await baseAccount.isModuleEnabled(
      DEFAULT_MULTICHAIN_MODULE
    )
    const moduleActive2 = polygonAccount.activeValidationModule
    expect(moduleEnabled2).toBeTruthy()
    expect(moduleActive2.getAddress()).toBe(DEFAULT_MULTICHAIN_MODULE)

    const encodedCall = encodeFunctionData({
      abi: parseAbi([
        "function safeMint(address owner) view returns (uint balance)"
      ]),
      functionName: "safeMint",
      args: [recipient]
    })

    const transaction = {
      to: nftAddress,
      data: encodedCall
    }

    const [partialUserOp1, partialUserOp2] = await Promise.all([
      baseAccount.buildUserOp([transaction], withSponsorship),
      polygonAccount.buildUserOp([transaction], withSponsorship)
    ])

    expect(partialUserOp1.paymasterAndData).not.toBe("0x")
    expect(partialUserOp2.paymasterAndData).not.toBe("0x")

    // Sign the user ops using multiChainModule
    const returnedOps = await multiChainModule.signUserOps([
      { userOp: partialUserOp1, chainId: chainIdBase },
      { userOp: partialUserOp2, chainId }
    ])

    // Send the signed user ops on both chains
    const userOpResponse1 = await baseAccount.sendSignedUserOp(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      returnedOps[0] as any
    )
    const userOpResponse2 = await polygonAccount.sendSignedUserOp(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      returnedOps[1] as any
    )

    Logger.log(userOpResponse1.userOpHash, "MULTICHAIN BASE USER OP HASH")
    Logger.log(userOpResponse2.userOpHash, "MULTICHAIN POLYGON USER OP HASH")

    expect(userOpResponse1.userOpHash).toBeTruthy()
    expect(userOpResponse2.userOpHash).toBeTruthy()

    const { success: success1 } = await userOpResponse1.wait()
    const { success: success2 } = await userOpResponse2.wait()

    expect(success1).toBe("true")
    expect(success2).toBe("true")
  }, 50000)
})
