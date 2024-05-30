import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  pad,
  parseAbi,
  parseEther,
  parseUnits,
  slice,
  toFunctionSelector
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type Transaction,
  type TransferOwnershipCompatibleModule,
  type WalletClientSigner,
  addressEquals,
  createSmartAccountClient
} from "../../src/account"
import { Logger, getChain } from "../../src/account"
import {
  type CreateSessionDataParams,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_MULTICHAIN_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION,
  createMultiChainValidationModule,
  createSessionKeyManagerModule,
  getABISVMSessionKeyData,
  resumeSession
} from "../../src/modules"

import { ECDSAModuleAbi } from "../../src/account/abi/ECDSAModule"
import { SessionMemoryStorage } from "../../src/modules/session-storage/SessionMemoryStorage"
import { createSessionKeyEOA } from "../../src/modules/session-storage/utils"
import {
  type Policy,
  type Session,
  createABISessionDatum,
  createSession,
  getSingleSessionTxParams
} from "../../src/modules/sessions/abi"
import {
  createBatchSession,
  getBatchSessionTxParams
} from "../../src/modules/sessions/batch"
import { createERC20SessionDatum } from "../../src/modules/sessions/erc20"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getBundlerUrl, getConfig, topUp } from "../utils"

describe("Modules:Write", () => {
  const nonceOptions = { nonceKey: Date.now() + 30 }
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
  const amount = parseUnits(".0001", 6)

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
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

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
    const { sessionKeyAddress, sessionStorageClient } =
      await createSessionKeyEOA(smartAccountThree, chain)

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
              referenceValue: smartAccountAddressThree
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
    Logger.log("Tx Hash: ", transactionHash)
  }, 50000)

  // User no longer has to be connected,
  // Only the reference to the relevant sessionID and the store from the previous step is needed to execute txs on the user's behalf
  test("should use the session to mint an NFT for the user", async () => {
    // Assume the real signer for userSmartAccountThree is no longer available (ie. user has logged out)
    const smartAccountThreeWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: smartAccountAddressThree, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      smartAccountAddressThree // Storage client, full Session or smartAccount address if using default storage
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
      { ...withSponsorship, nonceOptions }
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
  test("should create a batch session on behalf of a user", async () => {
    const { sessionKeyAddress, sessionStorageClient } =
      await createSessionKeyEOA(smartAccountFour, chain)

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
            referenceValue: smartAccountAddressFour
          }
        ],
        valueLimit: 0n
      })
    ]

    const { wait, session } = await createBatchSession(
      smartAccountFour,
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
    const { sessionStorageClient } = await resumeSession(
      smartAccountAddressFour // Use the store from the previous test, you could pass in the smartAccount address, the full session or your custom sessionStorageClient
    )

    // Assume the real signer for userSmartAccountFour is no longer available (ie. user has logged out);
    const smartAccountFourWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: sessionStorageClient.smartAccountAddress, // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId
      },
      smartAccountAddressFour, // Storage client, full Session or smartAccount address if using default storage
      true // if batching
    )

    const sessionSmartAccountFourAddress =
      await smartAccountFourWithSession.getAccountAddress()

    expect(
      addressEquals(sessionSmartAccountFourAddress, smartAccountAddressFour)
    ).toBe(true)

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

    const txs = [transferTx, nftMintTx]

    const batchSessionParams = await getBatchSessionTxParams(
      txs,
      [0, 1],
      smartAccountAddressFour,
      chain
    )

    const { wait } = await smartAccountFourWithSession.sendTransaction(txs, {
      ...batchSessionParams,
      ...withSponsorship,
      nonceOptions
    })
    const { success } = await wait()
    expect(success).toBe("true")

    const tokenBalanceAfter = await checkBalance(recipient, token)
    const nftBalanceAfter = await checkBalance(
      smartAccountAddressFour,
      nftAddress
    )
    expect(tokenBalanceAfter - tokenBalanceBefore).toBe(amount)
    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  }, 50000)

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

  test("should use SessionValidationModule to send a user op", async () => {
    let sessionSigner: WalletClientSigner
    const sessionKeyEOA = walletClient.account.address
    const recipient = walletClientTwo.account.address

    // Create smart account
    let smartAccount = await createSmartAccountClient({
      chainId,
      signer: walletClient,
      bundlerUrl,
      paymasterUrl,
      index: 11 // Increasing index to not conflict with other test cases and use a new smart account
    })
    const accountAddress = await smartAccount.getAccountAddress()
    const sessionMemoryStorage: SessionMemoryStorage = new SessionMemoryStorage(
      accountAddress
    )
    // First we need to check if smart account is deployed
    // if not deployed, send an empty transaction to deploy it
    const isDeployed = await smartAccount.isAccountDeployed()
    if (!isDeployed) {
      const { wait } = await smartAccount.deploy({
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }

    try {
      sessionSigner = await sessionMemoryStorage.getSignerByKey(
        sessionKeyEOA,
        chain
      )
    } catch (error) {
      sessionSigner = await sessionMemoryStorage.addSigner(
        {
          pbKey: sessionKeyEOA,
          pvKey: `0x${privateKey}`
        },
        chain
      )
    }

    expect(sessionSigner).toBeTruthy()
    // Create session module
    const sessionModule = await createSessionKeyManagerModule({
      moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      smartAccountAddress: await smartAccount.getAddress(),
      sessionStorageClient: sessionMemoryStorage
    })
    const functionSelector = slice(
      toFunctionSelector("safeMint(address)"),
      0,
      4
    )
    // Set enabled call on session
    const sessionKeyData = await getABISVMSessionKeyData(sessionKeyEOA as Hex, {
      destContract: "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0" as Hex, // nft address
      functionSelector: functionSelector,
      valueLimit: parseEther("0"),
      rules: [
        {
          offset: 0, // offset 0 means we are checking first parameter of safeMint (recipient address)
          condition: 0, // 0 = Condition.EQUAL
          referenceValue: pad("0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549", {
            size: 32
          }) // recipient address
        }
      ]
    })
    const abiSvmAddress = "0x000006bC2eCdAe38113929293d241Cf252D91861"
    const sessionTxData = await sessionModule.createSessionData([
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: abiSvmAddress,
        sessionPublicKey: sessionKeyEOA as Hex,
        sessionKeyData: sessionKeyData as Hex
      }
    ])
    const setSessionAllowedTrx = {
      to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      data: sessionTxData.data
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const txArray: any = []
    // Check if module is enabled
    const isEnabled = await smartAccount.isModuleEnabled(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )
    if (!isEnabled) {
      const enableModuleTrx = await smartAccount.getEnableModuleData(
        DEFAULT_SESSION_KEY_MANAGER_MODULE
      )
      txArray.push(enableModuleTrx)
      txArray.push(setSessionAllowedTrx)
    } else {
      Logger.log("MODULE ALREADY ENABLED")
      txArray.push(setSessionAllowedTrx)
    }
    const userOp = await smartAccount.buildUserOp(txArray, {
      nonceOptions,
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED
      }
    })
    const userOpResponse1 = await smartAccount.sendUserOp(userOp)
    const transactionDetails = await userOpResponse1.wait()
    expect(transactionDetails.success).toBe("true")
    Logger.log("Tx Hash: ", transactionDetails.receipt.transactionHash)
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: ["0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549"]
    })
    const nftMintTx = {
      to: "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0",
      data: encodedCall
    }
    smartAccount = smartAccount.setActiveValidationModule(sessionModule)
    const maticBalanceBefore = await checkBalance(smartAccountAddress)
    const userOpResponse2 = await smartAccount.sendTransaction(nftMintTx, {
      nonceOptions,
      params: {
        sessionSigner: sessionSigner,
        sessionValidationModule: abiSvmAddress
      },
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED
      }
    })
    expect(userOpResponse2.userOpHash).toBeTruthy()
    expect(userOpResponse2.userOpHash).not.toBeNull()
    const maticBalanceAfter = await checkBalance(smartAccountAddress)
    expect(maticBalanceAfter).toEqual(maticBalanceBefore)
  }, 60000)

  test("should enable batched module", async () => {
    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      paymasterUrl
    })

    const isBRMenabled = await smartAccount.isModuleEnabled(
      DEFAULT_BATCHED_SESSION_ROUTER_MODULE
    )

    if (!isBRMenabled) {
      const tx = await smartAccount.getEnableModuleData(
        DEFAULT_BATCHED_SESSION_ROUTER_MODULE
      )
      const { wait } = await smartAccount.sendTransaction(tx, {
        nonceOptions,
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }
  }, 50000)

  test.skip("should use ABI SVM to allow transfer ownership of smart account", async () => {
    const smartAccount = await createSmartAccountClient({
      chainId,
      signer: walletClient,
      bundlerUrl,
      paymasterUrl,
      index: 10 // Increasing index to not conflict with other test cases and use a new smart account
    })

    const smartAccountAddressForPreviousOwner =
      await smartAccount.getAccountAddress()

    const signerOfAccount = walletClient.account.address
    const ownerOfAccount = await publicClient.readContract({
      address: DEFAULT_ECDSA_OWNERSHIP_MODULE,
      abi: ECDSAModuleAbi,
      functionName: "getOwner",
      args: [await smartAccount.getAccountAddress()]
    })

    if (ownerOfAccount !== signerOfAccount) {
      // Re-create the smart account instance with the new owner
      const smartAccountWithOtherOwner = await createSmartAccountClient({
        chainId,
        signer: walletClientTwo,
        bundlerUrl,
        paymasterUrl,
        accountAddress: smartAccountAddressForPreviousOwner
      })

      // Transfer ownership back to walletClient 1
      await smartAccountWithOtherOwner.transferOwnership(
        walletClient.account.address,
        DEFAULT_ECDSA_OWNERSHIP_MODULE as TransferOwnershipCompatibleModule,
        { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }
      )
    }

    let sessionSigner: WalletClientSigner
    const sessionKeyEOA = walletClient.account.address
    const newOwner = walletClientTwo.account.address

    const accountAddress = await smartAccount.getAccountAddress()
    const sessionMemoryStorage: SessionMemoryStorage = new SessionMemoryStorage(
      accountAddress
    )
    // First we need to check if smart account is deployed
    // if not deployed, send an empty transaction to deploy it
    const isDeployed = await smartAccount.isAccountDeployed()
    if (!isDeployed) {
      const { wait } = await smartAccount.deploy({
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }

    try {
      sessionSigner = await sessionMemoryStorage.getSignerByKey(
        sessionKeyEOA,
        chain
      )
    } catch (error) {
      sessionSigner = await sessionMemoryStorage.addSigner(
        {
          pbKey: sessionKeyEOA,
          pvKey: `0x${privateKeyTwo}`
        },
        chain
      )
    }

    expect(sessionSigner).toBeTruthy()
    // Create session module
    const sessionModule = await createSessionKeyManagerModule({
      moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      smartAccountAddress: await smartAccount.getAddress(),
      sessionStorageClient: sessionMemoryStorage
    })
    const functionSelectorTransferOwnership = slice(
      toFunctionSelector("transferOwnership(address) public"),
      0,
      4
    )
    const sessionKeyDataTransferOwnership = await getABISVMSessionKeyData(
      sessionKeyEOA as Hex,
      {
        destContract: ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION.V1_0_0 as Hex, // ECDSA module address
        functionSelector: functionSelectorTransferOwnership,
        valueLimit: parseEther("0"),
        rules: [
          {
            offset: 0, // offset 0 means we are checking first parameter of transferOwnership (recipient address)
            condition: 0, // 0 = Condition.EQUAL
            referenceValue: pad(walletClient.account.address, {
              size: 32
            }) // new owner address
          }
        ]
      }
    )
    const abiSvmAddress = "0x000006bC2eCdAe38113929293d241Cf252D91861"
    const sessionTxDataTransferOwnership =
      await sessionModule.createSessionData([
        {
          validUntil: 0,
          validAfter: 0,
          sessionValidationModule: abiSvmAddress,
          sessionPublicKey: sessionKeyEOA as Hex,
          sessionKeyData: sessionKeyDataTransferOwnership as Hex
        }
      ])
    const setSessionAllowedTransferOwnerhsipTrx = {
      to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      data: sessionTxDataTransferOwnership.data
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const txArray: any = []
    // Check if module is enabled
    const isEnabled = await smartAccount.isModuleEnabled(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )

    if (!isEnabled) {
      const enableModuleTrx = await smartAccount.getEnableModuleData(
        DEFAULT_SESSION_KEY_MANAGER_MODULE
      )
      txArray.push(enableModuleTrx)
      txArray.push(setSessionAllowedTransferOwnerhsipTrx)
    } else {
      Logger.log("MODULE ALREADY ENABLED")
      txArray.push(setSessionAllowedTransferOwnerhsipTrx)
    }
    const userOpResponse1 = await smartAccount.sendTransaction(txArray, {
      nonceOptions,
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    })
    const transactionDetails = await userOpResponse1.wait()
    expect(transactionDetails.success).toBe("true")
    Logger.log("Tx Hash: ", transactionDetails.receipt.transactionHash)

    // Transfer ownership back to walletClient
    await smartAccount.transferOwnership(
      newOwner,
      DEFAULT_ECDSA_OWNERSHIP_MODULE as TransferOwnershipCompatibleModule,
      {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        params: {
          sessionSigner: sessionSigner,
          sessionValidationModule: abiSvmAddress
        }
      }
    )
  }, 60000)

  test("should correctly parse the reference value and explicitly pass the storage client while resuming the session", async () => {
    const DUMMY_CONTRACT_ADDRESS: Hex =
      "0xC834b3804817883a6b7072e815C3faf8682bFA13"
    const byteCode = await publicClient.getBytecode({
      address: DUMMY_CONTRACT_ADDRESS as Hex
    })

    expect(byteCode).toBeTruthy()

    const { sessionKeyAddress, sessionStorageClient } =
      await createSessionKeyEOA(
        smartAccount,
        chain,
        new SessionMemoryStorage(smartAccountAddress)
      )

    const order = parseAbi(["function submitOrder(uint256 _orderNum)"])
    const cancel = parseAbi(["function submitCancel(uint256 _orderNum)"])

    const sessionBatch: CreateSessionDataParams[] = [
      createABISessionDatum({
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        contractAddress: DUMMY_CONTRACT_ADDRESS,
        functionSelector: cancel[0],
        rules: [
          {
            offset: 0,
            condition: 0,
            referenceValue: BigInt(1)
          }
        ],
        valueLimit: 0n
      }),
      createABISessionDatum({
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        contractAddress: DUMMY_CONTRACT_ADDRESS,
        functionSelector: order[0],
        rules: [
          {
            offset: 0,
            condition: 0,
            referenceValue: BigInt(1)
          }
        ],
        valueLimit: 0n
      })
    ]

    const { wait, session } = await createBatchSession(
      smartAccount,
      sessionStorageClient,
      sessionBatch,
      withSponsorship
    )

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")
    expect(transactionHash).toBeTruthy()

    const smartAccountWithSession = await createSessionSmartAccountClient(
      {
        accountAddress: await smartAccount.getAccountAddress(), // Set the account address on behalf of the user
        bundlerUrl,
        paymasterUrl,
        chainId: chain.id
      },
      sessionStorageClient, // Storage client, full Session or smartAccount address if using default storage
      true
    )

    const submitCancelTx: Transaction = {
      to: DUMMY_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: cancel,
        functionName: "submitCancel",
        args: [BigInt(1)]
      })
    }

    const submitOrderTx: Transaction = {
      to: DUMMY_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: order,
        functionName: "submitOrder",
        args: [BigInt(1)]
      })
    }

    const txs = [submitOrderTx, submitCancelTx]
    const correspondingIndexes = [1, 0] // The order of the txs from the sessionBatch

    const batchSessionParams = await getBatchSessionTxParams(
      txs,
      correspondingIndexes,
      sessionStorageClient,
      chain
    )

    const { wait: waitForTx } = await smartAccountWithSession.sendTransaction(
      txs,
      {
        ...batchSessionParams,
        ...withSponsorship,
        nonceOptions
      }
    )

    const { success: txSuccess } = await waitForTx()
    expect(txSuccess).toBe("true")
  }, 60000)

  test("should use single session for submitting orders", async () => {
    const DUMMY_CONTRACT_ADDRESS: Hex =
      "0xC834b3804817883a6b7072e815C3faf8682bFA13"
    const byteCode = await publicClient.getBytecode({
      address: DUMMY_CONTRACT_ADDRESS as Hex
    })

    expect(byteCode).toBeTruthy()

    const { sessionKeyAddress, sessionStorageClient } =
      await createSessionKeyEOA(smartAccount, chain)

    const order = parseAbi(["function submitOrder(uint256 _orderNum)"])
    const cancel = parseAbi(["function submitCancel(uint256 _orderNum)"])

    const policy: Policy[] = [
      {
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        contractAddress: DUMMY_CONTRACT_ADDRESS,
        functionSelector: cancel[0],
        rules: [
          {
            offset: 0,
            condition: 0,
            referenceValue: BigInt(1)
          }
        ],
        valueLimit: 0n
      },
      {
        interval: {
          validUntil: 0,
          validAfter: 0
        },
        sessionKeyAddress,
        contractAddress: DUMMY_CONTRACT_ADDRESS,
        functionSelector: order[0],
        rules: [
          {
            offset: 0,
            condition: 0,
            referenceValue: BigInt(1)
          }
        ],
        valueLimit: 0n
      }
    ]

    const { wait, session } = await createSession(
      smartAccount,
      policy,
      sessionStorageClient,
      withSponsorship
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
      smartAccountAddress
    )

    const submitCancelTx: Transaction = {
      to: DUMMY_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: cancel,
        functionName: "submitCancel",
        args: [BigInt(1)]
      })
    }

    const submitOrderTx: Transaction = {
      to: DUMMY_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: order,
        functionName: "submitOrder",
        args: [BigInt(1)]
      })
    }

    const singleSessionParamsForCancel = await getSingleSessionTxParams(
      session,
      chain,
      0
    )

    const singleSessionParamsForOrder = await getSingleSessionTxParams(
      session,
      chain,
      1
    )

    const { wait: waitForCancelTx } =
      await smartAccountWithSession.sendTransaction(submitCancelTx, {
        nonceOptions,
        ...singleSessionParamsForCancel,
        ...withSponsorship
      })
    const { wait: waitForOrderTx } =
      await smartAccountWithSession.sendTransaction(submitOrderTx, {
        nonceOptions,
        ...singleSessionParamsForOrder,
        ...withSponsorship
      })

    const { success: txCancelSuccess } = await waitForCancelTx()
    const { success: txOrderSuccess } = await waitForOrderTx()
    expect(txCancelSuccess).toBe("true")
    expect(txOrderSuccess).toBe("true")
  }, 60000)
})
