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
  type WalletClientSigner,
  createSmartAccountClient
} from "../../src/account"
import { Logger, getChain } from "../../src/account"
import {
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_MULTICHAIN_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  createBatchedSessionRouterModule,
  createMultiChainValidationModule,
  createSessionKeyManagerModule,
  getABISVMSessionKeyData
} from "../../src/modules"
import { SessionMemoryStorage } from "../../src/modules/session-storage/SessionMemoryStorage"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getBundlerUrl, getConfig, topUp } from "../utils"

describe("Modules:Write", () => {
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

  test.skip("should enable session module", async () => {
    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      paymasterUrl
    })

    const isSessionKeyEnabled = await smartAccount.isModuleEnabled(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )

    if (!isSessionKeyEnabled) {
      const tx = await smartAccount.getEnableModuleData(
        DEFAULT_SESSION_KEY_MANAGER_MODULE
      )
      const { wait } = await smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }
  }, 50000)

  test.skip("should use MultichainValidationModule to mint an NFT on two chains with sponsorship", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
    const recipientForBothChains = walletClient.account.address

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
      const { wait } = await polygonAccount.deploy({
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }
    if (!isBaseDeployed) {
      const { wait } = await baseAccount.deploy({
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
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
      args: [recipientForBothChains]
    })

    const transaction = {
      to: nftAddress,
      data: encodedCall
    }

    const [partialUserOp1, partialUserOp2] = await Promise.all([
      baseAccount.buildUserOp([transaction], {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      }),
      polygonAccount.buildUserOp([transaction], {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
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

  test.skip("should use SessionValidationModule to send a user op", async () => {
    let sessionSigner: WalletClientSigner
    const sessionKeyEOA = walletClient.account.address
    const recipient = walletClientTwo.account.address

    // Create smart account
    let smartAccount = await createSmartAccountClient({
      chainId,
      signer: walletClient,
      bundlerUrl,
      paymasterUrl,
      index: 5 // Increasing index to not conflict with other test cases and use a new smart account
    })
    const accountAddress = await smartAccount.getAccountAddress()
    const sessionMemoryStorage: SessionMemoryStorage = new SessionMemoryStorage(
      accountAddress
    )
    // First we need to check if smart account is deployed
    // if not deployed, send an empty transaction to deploy it
    const isDeployed = await smartAccount.isAccountDeployed()
    Logger.log("session", { isDeployed })
    if (!isDeployed) {
      const { wait } = await smartAccount.deploy({
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }

    try {
      sessionSigner = await sessionMemoryStorage.getSignerByKey(sessionKeyEOA)
    } catch (error) {
      sessionSigner = await sessionMemoryStorage.addSigner({
        pbKey: sessionKeyEOA,
        pvKey: `0x${privateKey}`,
        chainId: chain
      })
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
    Logger.log(
      `Tx at: https://jiffyscan.xyz/userOpHash/${userOpResponse2.userOpHash}?network=mumbai`
    )
  }, 60000)

  test.skip("should enable batched module", async () => {
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
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
      })
      const { success } = await wait()
      expect(success).toBe("true")
    }
  }, 50000)

  test.skip("should use BatchedSessionValidationModule to send a user op", async () => {
    let sessionSigner: WalletClientSigner
    const sessionKeyEOA = walletClient.account.address
    const recipient = walletClientTwo.account.address
    const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"

    let smartAccount = await createSmartAccountClient({
      chainId,
      signer: walletClient,
      bundlerUrl,
      paymasterUrl,
      index: 6 // Increasing index to not conflict with other test cases and use a new smart account
    })

    // const accountAddress = await smartAccount.getAccountAddress()
    const smartAccountAddress = await smartAccount.getAddress()
    await topUp(smartAccountAddress, undefined, token)
    await topUp(smartAccountAddress, undefined)

    const sessionMemoryStorage: SessionMemoryStorage = new SessionMemoryStorage(
      smartAccountAddress
    )

    try {
      sessionSigner = await sessionMemoryStorage.getSignerByKey(sessionKeyEOA)
    } catch (error) {
      sessionSigner = await sessionMemoryStorage.addSigner({
        pbKey: sessionKeyEOA,
        pvKey: `0x${privateKey}`,
        chainId: chain
      })
    }

    expect(sessionSigner).toBeTruthy()
    const sessionModule = await createSessionKeyManagerModule({
      moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      smartAccountAddress,
      sessionStorageClient: sessionMemoryStorage
    })
    // Create batched session module
    const batchedSessionModule = await createBatchedSessionRouterModule({
      moduleAddress: DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
      smartAccountAddress,
      sessionKeyManagerModule: sessionModule
    })

    // Set enabled call on session, only allows calling USDC contract transfer with <= 10 USDC
    const sessionKeyData = encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" }
      ],
      [
        sessionKeyEOA,
        token, // erc20 token address
        recipient, // receiver address
        parseUnits("10", 6)
      ]
    )
    // only requires that the caller is the session key
    // can call anything using the mock session module
    const sessionKeyData2 = encodeAbiParameters(
      [{ type: "address" }],
      [sessionKeyEOA]
    )
    const erc20ModuleAddr = "0x000000D50C68705bd6897B2d17c7de32FB519fDA"
    const mockSessionModuleAddr = "0x7Ba4a7338D7A90dfA465cF975Cc6691812C3772E"
    const sessionTxData = await batchedSessionModule.createSessionData([
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: erc20ModuleAddr,
        sessionPublicKey: sessionKeyEOA,
        sessionKeyData: sessionKeyData
      },
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: mockSessionModuleAddr,
        sessionPublicKey: sessionKeyEOA,
        sessionKeyData: sessionKeyData2
      }
    ])

    const setSessionAllowedTrx = {
      to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      data: sessionTxData.data
    }

    const isDeployed = await smartAccount.isAccountDeployed()
    if (!isDeployed) {
      const { wait } = await smartAccount.deploy()
      const { success } = await wait()
      expect(success).toBe("true")
    }

    const txArray: Transaction[] = []
    // Check if session module is enabled
    const isEnabled = await smartAccount.isModuleEnabled(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )
    if (!isEnabled) {
      const enableModuleTrx = await smartAccount.getEnableModuleData(
        DEFAULT_SESSION_KEY_MANAGER_MODULE
      )
      txArray.push(enableModuleTrx)
    }
    // Check if batched session module is enabled
    const isBRMenabled = await smartAccount.isModuleEnabled(
      DEFAULT_BATCHED_SESSION_ROUTER_MODULE
    )
    if (!isBRMenabled) {
      // -----> enableModule batched session router module
      const tx2 = await smartAccount.getEnableModuleData(
        DEFAULT_BATCHED_SESSION_ROUTER_MODULE
      )
      txArray.push(tx2)
    }
    txArray.push(setSessionAllowedTrx)
    const userOpResponse1 = await smartAccount.sendTransaction(txArray, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    }) // this user op will enable the modules and setup session allowed calls
    const transactionDetails = await userOpResponse1.wait()
    expect(transactionDetails.success).toBe("true")
    Logger.log("Tx Hash: ", transactionDetails.receipt.transactionHash)

    const usdcBalance = await checkBalance(smartAccountAddress, token)
    const nativeTokenBalance = await checkBalance(smartAccountAddress)

    expect(usdcBalance).toBeGreaterThan(0)
    smartAccount = smartAccount.setActiveValidationModule(batchedSessionModule)
    // WARNING* If the smart account does not have enough USDC, user op execution will FAIL
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
      functionName: "transfer",
      args: [recipient, parseUnits("0.001", 6)]
    })
    const encodedCall2 = encodeFunctionData({
      abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
      functionName: "transfer",
      args: [
        "0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549",
        parseUnits("0.001", 6)
      ]
    })
    const transferTx = {
      to: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a",
      data: encodedCall
    }
    const transferTx2 = {
      to: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a",
      data: encodedCall2
    }
    const activeModule = smartAccount.activeValidationModule
    expect(activeModule).toEqual(batchedSessionModule)
    const maticBalanceBefore = await checkBalance(smartAccountAddress)
    // failing with dummyTx because of invalid sessionKeyData
    const userOpResponse2 = await smartAccount.sendTransaction(
      [transferTx, transferTx2],
      {
        params: {
          batchSessionParams: [
            {
              sessionSigner: walletClient,
              sessionValidationModule: erc20ModuleAddr
            },
            {
              sessionSigner: walletClient,
              sessionValidationModule: mockSessionModuleAddr
            }
          ]
        },
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED
        }
      }
    )
    const receipt = await userOpResponse2.wait()
    console.log(receipt.userOpHash, "Batched user op hash")
    expect(receipt.success).toBe("true")
    expect(userOpResponse2.userOpHash).toBeTruthy()
    expect(userOpResponse2.userOpHash).not.toBeNull()
    const maticBalanceAfter = await checkBalance(smartAccountAddress)
    expect(maticBalanceAfter).toEqual(maticBalanceBefore)
    Logger.log(
      `Tx at: https://jiffyscan.xyz/userOpHash/${userOpResponse2.userOpHash}?network=mumbai`
    )
  }, 60000)
})
