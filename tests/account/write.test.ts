import {
  http,
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
  parseAbi,
  stringToBytes,
  toBytes,
  toHex,
  zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  MOCK_EXECUTOR,
  MOCK_FALLBACK_HANDLER,
  MOCK_HOOK,
  type UserOpReceipt,
  type UserOpResponse
} from "../../src"
import {
  type BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ERC20_ABI,
  K1_VALIDATOR,
  ModuleType,
  type TransferOwnershipCompatibleModule,
  createSmartAccountClient,
  getCustomChain,
  percentage
} from "../../src/account"
import { ECDSAModuleAbi } from "../../src/account/abi/ECDSAModule"
import { EntryPointAbi } from "../../src/account/abi/EntryPointAbi"
import { NexusAccountAbi } from "../../src/account/abi/SmartAccount"
import { PaymasterMode } from "../../src/paymaster"
import { testOnlyOnOptimism } from "../setupFiles"
import {
  checkBalance,
  getBundlerUrl,
  getConfig,
  nonZeroBalance,
  topUp
} from "../utils"

describe("Account:Write", async () => {
  const nonceOptions = { nonceKey: BigInt(Date.now() + 10) }
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
  const sender = account.address
  const recipient = accountTwo.address
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  // let [smartAccount, smartAccountTwo]: BiconomySmartAccountV2[] = []
  // let [smartAccountAddress, smartAccountAddressTwo]: Hex[] = []

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

  let smartAccount: BiconomySmartAccountV2
  let smartAccountTwo: BiconomySmartAccountV2
  let smartAccountAddress: Address
  let smartAccountAddressTwo: Address

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

  // describe("Account:Basics", async () => {
  //   test("Build a user op with pimlico bundler", async () => {
  //     const encodedCall = encodeFunctionData({
  //       abi: parseAbi(["function safeMint(address _to)"]),
  //       functionName: "safeMint",
  //       args: [recipient]
  //     })
  //     const transaction = {
  //       to: nftAddress, // NFT address
  //       data: encodedCall
  //     }
  //     const userOp = await smartAccount.buildUserOp([transaction])
  //     expect(userOp).toBeTruthy()
  //   }, 60000)

  //   test("Mint NFT - Single Call", async () => {
  //     const encodedCall = encodeFunctionData({
  //       abi: parseAbi(["function safeMint(address _to)"]),
  //       functionName: "safeMint",
  //       args: [recipient]
  //     })
  //     const transaction = {
  //       to: nftAddress, // NFT address
  //       data: encodedCall
  //     }
  //     const gasCost = await smartAccount.getGasEstimate([transaction])
  //     console.log(gasCost, "gasCost")

  //     const userOpHash = await smartAccount.sendTransaction([transaction])

  //     expect(userOpHash).toBeTruthy()
  //   }, 60000)

  //   test("Mint NFT's - Batch Call", async () => {
  //     const encodedCall = encodeFunctionData({
  //       abi: parseAbi(["function safeMint(address _to)"]),
  //       functionName: "safeMint",
  //       args: [recipient]
  //     })
  //     const transaction = {
  //       to: nftAddress, // NFT address
  //       data: encodedCall,
  //       value: 0n
  //     }
  //     const userOpResponse = await smartAccount.sendTransaction([
  //       transaction,
  //       transaction
  //     ])
  //     const userOpReceipt: UserOpReceipt = await userOpResponse.wait()
  //     console.log(userOpReceipt.userOpHash, "user op hash")

  //     expect(userOpReceipt.success).toBe(true)
  //   }, 60000)
  // })

  // describe("Account:Validation Module", async () => {
  //   test("should install a dummy K1Validator module", async () => {
  //     const newK1ValidatorContract =
  //       "0x26d3E02a086D5182F4921CF1917fe9E6462E0495"
  //     const userOpResponse: UserOpResponse = await smartAccount.installModule(
  //       ModuleType.Validation,
  //       newK1ValidatorContract,
  //       account.address
  //     )
  //     const userOpReceipt = await userOpResponse.wait()

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Validation,
  //       newK1ValidatorContract
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeTruthy()
  //   }, 60000)

  //   test("should uninstall dummy K1Validator module", async () => {
  //     const newK1ValidatorContract =
  //       "0x26d3E02a086D5182F4921CF1917fe9E6462E0495"

  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = encodeAbiParameters(
  //       [
  //         { name: "prev", type: "address" },
  //         { name: "disableModuleData", type: "bytes" }
  //       ],
  //       [prevAddress, toHex(stringToBytes(""))]
  //     )
  //     const userOpResponse = await smartAccount.uninstallModule(
  //       ModuleType.Validation,
  //       newK1ValidatorContract,
  //       deInitData
  //     )
  //     const userOpReceipt = await userOpResponse.wait()

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Validation,
  //       newK1ValidatorContract
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)

  //   test("should fail to install an already installed Validator", async () => {
  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Validation,
  //       K1_VALIDATOR
  //     )
  //     expect(isInstalled).toBeTruthy()

  //     const userOpResponse = smartAccount.installModule(
  //       ModuleType.Validation,
  //       K1_VALIDATOR,
  //       account.address
  //     )
  //     await expect(userOpResponse).rejects.toThrowError("Error from Bundler:")
  //   }, 60000)
  // })

  describe("Account:Execution Module Tests", async () => {
    // test("install a mock Execution module", async () => {
    //   const userOpResponse: UserOpResponse = await smartAccount.installModule(
    //     ModuleType.Execution,
    //     MOCK_EXECUTOR,
    //     account.address
    //   )
    //   const userOpReceipt = await userOpResponse.wait()

    //   const isInstalled = await smartAccount.isModuleInstalled(
    //     ModuleType.Execution,
    //     MOCK_EXECUTOR
    //   )

    //   expect(userOpReceipt.success).toBe(true)
    //   expect(isInstalled).toBeTruthy()
    // }, 60000)

    test("get installed executors", async () => {
      const installedExecutors: Address[] =
        await smartAccount.getInstalledExecutors()
      console.log(installedExecutors, "installed executors")
      expect(installedExecutors.includes(MOCK_EXECUTOR)).toBeTruthy()
    }, 60000)

    // test("uninstall executor module", async () => {
    //   const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
    //   const deInitData = encodeAbiParameters(
    //     [
    //       { name: "prev", type: "address" },
    //       { name: "disableModuleData", type: "bytes" }
    //     ],
    //     [prevAddress, toHex(stringToBytes(""))]
    //   )
    //   const userOpResponse = await smartAccount.uninstallModule(
    //     ModuleType.Execution,
    //     MOCK_EXECUTOR,
    //     deInitData
    //   )
    //   const userOpReceipt = await userOpResponse.wait()

    //   const isInstalled = await smartAccount.isModuleInstalled(
    //     ModuleType.Execution,
    //     MOCK_EXECUTOR
    //   )

    //   expect(userOpReceipt.success).toBe(true)
    //   expect(isInstalled).toBeFalsy()
    //   expect(userOpReceipt).toBeTruthy()
    // }, 60000)

    // test("should fail to install same executor module", async () => {
    //   const isInstalled = await smartAccount.isModuleInstalled(
    //     ModuleType.Validation,
    //     K1_VALIDATOR
    //   )
    //   expect(isInstalled).toBeTruthy()

    //   const userOpResponse = smartAccount.installModule(
    //     ModuleType.Validation,
    //     K1_VALIDATOR,
    //     account.address
    //   )
    //   await expect(userOpResponse).rejects.toThrowError("Error from Bundler:")
    // }, 60000)

    // test("send user op using the executor call type single", async () => {
    //   const encodedCall = encodeFunctionData({
    //     abi: parseAbi(["function safeMint(address _to)"]),
    //     functionName: "safeMint",
    //     args: [recipient]
    //   })
    //   const transaction = {
    //     to: nftAddress,
    //     data: encodedCall
    //   }
    //   const userOpResponse = await smartAccount.sendTransactionWithExecutor(transaction, MOCK_EXECUTOR);
    //   const userOpReceipt: UserOpReceipt = await userOpResponse.wait()
    //   console.log(userOpReceipt.userOpHash, "user op hash");
    // }, 60000)

    test("send user op using the executor call type batch", async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })
      const transaction = {
        to: nftAddress,
        data: encodedCall
      }
      const userOpResponse = await smartAccount.sendTransactionWithExecutor([transaction, transaction], MOCK_EXECUTOR);
      const userOpReceipt: UserOpReceipt = await userOpResponse.wait()
      console.log(userOpReceipt.userOpHash, "user op hash");
    }, 60000)
  // })

  // describe("Account:Hook Module Tests", async () => {
  //   test("install a mock Hook module", async () => {
  //     const isSupported = await smartAccount.supportsModule(ModuleType.Hooks)
  //     console.log(isSupported, "is supported")

  //     const isInstalledBefore = await smartAccount.isModuleInstalled(
  //       ModuleType.Hooks,
  //       MOCK_HOOK
  //     )
  //     console.log(isInstalledBefore, "is installed before")

  //     const userOpResponse: UserOpResponse = await smartAccount.installModule(
  //       ModuleType.Hooks,
  //       MOCK_HOOK
  //     )
  //     const userOpReceipt = await userOpResponse.wait()
  //     console.log(userOpReceipt, "user op receipt")

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hooks,
  //       MOCK_HOOK
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeTruthy()
  //   }, 60000)

  //   test("get active hook", async () => {
  //     const activeHook: Address = await smartAccount.getActiveHook()
  //     console.log(activeHook, "active hook")
  //     expect(activeHook).toBe(MOCK_HOOK)
  //   }, 60000)

  //   test("uninstall executor module", async () => {
  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = encodeAbiParameters(
  //       [
  //         { name: "prev", type: "address" },
  //         { name: "disableModuleData", type: "bytes" }
  //       ],
  //       [prevAddress, toHex(stringToBytes(""))]
  //     )
  //     const userOpResponse = await smartAccount.uninstallModule(
  //       ModuleType.Hooks,
  //       MOCK_HOOK,
  //       deInitData
  //     )
  //     const userOpReceipt = await userOpResponse.wait()

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hooks,
  //       MOCK_HOOK
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)

  //   test("should fail to install same executor module", async () => {
  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Validation,
  //       K1_VALIDATOR
  //     )
  //     expect(isInstalled).toBeTruthy()

  //     const userOpResponse = smartAccount.installModule(
  //       ModuleType.Validation,
  //       K1_VALIDATOR,
  //       account.address
  //     )
  //     await expect(userOpResponse).rejects.toThrowError("Error from Bundler:")
  //   }, 60000)

  //   test("send user op using the executor", async () => {
  //     // const encodedCall = encodeFunctionData({
  //     //   abi: parseAbi(["function safeMint(address _to)"]),
  //     //   functionName: "safeMint",
  //     //   args: [recipient]
  //     // })
  //     const transaction = {
  //       to: zeroAddress,
  //       data: "0x"
  //     }

  //     const userOpResponse2 = await smartAccount.sendTransaction(transaction, {
  //       useExecutor: true
  //     })
  //     const userOpReceipt2: UserOpReceipt = await userOpResponse2.wait()

  //     console.log(userOpReceipt2.userOpHash, "user op hash 2")
  //   }, 60000)
  // })

  // describe("Account:Fallback Handler Module Tests", async () => {
  //   test("install a fallback handler Hook module", async () => {
  //     const isSupported = await smartAccount.supportsModule(ModuleType.Fallback)
  //     console.log(isSupported, "is supported")

  //     const isInstalledBefore = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER
  //     )
  //     console.log(isInstalledBefore, "is installed before")

  //     const userOpResponse: UserOpResponse = await smartAccount.installModule(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER
  //     )
  //     const userOpReceipt = await userOpResponse.wait()
  //     console.log(userOpReceipt, "user op receipt")

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeTruthy()
  //   }, 60000)

  //   test("get active hook", async () => {
  //     const activeHook: Address = await smartAccount.getActiveHook()
  //     console.log(activeHook, "active hook")
  //     expect(activeHook).toBe(MOCK_HOOK)
  //   }, 60000)

  //   test("uninstall executor module", async () => {
  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = encodeAbiParameters(
  //       [
  //         { name: "prev", type: "address" },
  //         { name: "disableModuleData", type: "bytes" }
  //       ],
  //       [prevAddress, toHex(stringToBytes(""))]
  //     )
  //     const userOpResponse = await smartAccount.uninstallModule(
  //       ModuleType.Hooks,
  //       MOCK_HOOK,
  //       deInitData
  //     )
  //     const userOpReceipt = await userOpResponse.wait()

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hooks,
  //       MOCK_HOOK
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)

  //   test("should fail to install same executor module", async () => {
  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Validation,
  //       K1_VALIDATOR
  //     )
  //     expect(isInstalled).toBeTruthy()

  //     const userOpResponse = smartAccount.installModule(
  //       ModuleType.Validation,
  //       K1_VALIDATOR,
  //       account.address
  //     )
  //     await expect(userOpResponse).rejects.toThrowError("Error from Bundler:")
  //   }, 60000)

  //   test("send user op using the executor", async () => {
  //     // const encodedCall = encodeFunctionData({
  //     //   abi: parseAbi(["function safeMint(address _to)"]),
  //     //   functionName: "safeMint",
  //     //   args: [recipient]
  //     // })
  //     const transaction = {
  //       to: zeroAddress,
  //       data: "0x"
  //     }

  //     const userOpResponse2 = await smartAccount.sendTransaction(transaction, {
  //       useExecutor: true
  //     })
  //     const userOpReceipt2: UserOpReceipt = await userOpResponse2.wait()

  //     console.log(userOpReceipt2.userOpHash, "user op hash 2")
  //   }, 60000)
  })
})
