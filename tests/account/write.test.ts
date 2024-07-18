import { ethers } from "ethers"
import {
  http,
  type Address,
  type Hex,
  concat,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  hexToBytes,
  pad,
  parseAbi,
  stringToBytes,
  toBytes,
  toHex
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect, test } from "vitest"
import {
  GENERIC_FALLBACK_SELECTOR,
  MOCK_EXECUTOR,
  MOCK_FALLBACK_HANDLER,
  MOCK_HOOK,
  MODE_MODULE_ENABLE,
  MODULE_TYPE_MULTI,
  createOwnableExecutorModule,
  makeInstallDataAndHash
} from "../../src"
import {
  K1_VALIDATOR,
  ModuleType,
  createSmartAccountClient
} from "../../src/account"
import type { UserOpReceipt } from "../../src/bundler"
import { getConfig } from "../utils"

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

  const [walletClient] = [
    createWalletClient({
      account,
      chain,
      transport: http()
    })
  ]

  const smartAccount = await createSmartAccountClient({
    chainId,
    signer: walletClient,
    bundlerUrl,
    paymasterUrl
  })

  const ownableExecutorModule = await createOwnableExecutorModule(smartAccount)
  smartAccount.setactiveExecutionModule(ownableExecutorModule)

  console.log(`Using SA at address : ${await smartAccount.getAddress()}`)
  console.log(`Using Signer with address : ${await account.address}`)

  describe("Account:Basics", async () => {
    test("Build a user op with pimlico bundler", async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })
      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }
      const userOp = await smartAccount.buildUserOp([transaction])
      expect(userOp).toBeTruthy()
    }, 60000)

    // test("Mint NFT - Single Call", async () => {
    //   const encodedCall = encodeFunctionData({
    //     abi: parseAbi(["function safeMint(address _to)"]),
    //     functionName: "safeMint",
    //     args: [recipient]
    //   })

    //   console.log(recipient, "recipient")

    //   // smartAccount.setActiveValidationModule()

    //   // const isInstalled = await smartAccount.isModuleInstalled({moduleType: ModuleType.Validation, moduleAddress: K1_VALIDATOR});
    //   // console.log(isInstalled);

    //   const transaction = {
    //     to: nftAddress, // NFT address
    //     data: encodedCall
    //   }
    //   const gasCost = await smartAccount.getGasEstimate([transaction])
    //   console.log(gasCost, "gasCost")

    //   const response = await smartAccount.sendTransaction([transaction])
    //   const receipt = await response.wait()

    //   console.log(receipt, "receipt")

    //   expect(receipt.userOpHash).toBeTruthy()
    // }, 60000)

    // test("Use enable mode", async () => {
    //   const counterAddress = "0x6BFE41FF0605a87911c0542bF958691ea2ac77f8"; // base sepolia

    //   const counterBefore = await publicClient.readContract({
    //     address: counterAddress,
    //     abi: parseAbi(["function getCount() external view returns(uint256)"]),
    //     functionName: "getCount"
    //   })

    //   console.log(counterBefore, "counter before");

    //   const encodedCall = encodeFunctionData({
    //     abi: parseAbi(["function increment() external view returns(uint256)"]),
    //     functionName: "increment",
    //   })
    //   let userOp = await smartAccount.buildUserOp([{to: counterAddress, data: encodedCall}], {nonceOptions: {validationMode: MODE_MODULE_ENABLE}})
    //   const [multiInstallData, hashToSign] = makeInstallDataAndHash(walletClient.account?.address!);
    //   const enableModeSig = encodePacked(['address', 'bytes'], [K1_VALIDATOR, await smartAccount.signMessage(hashToSign)])

    //   const enableModeSigPrefix = concat([
    //     toBytes(MODULE_TYPE_MULTI),
    //     pad(toBytes(BigInt(hexToBytes(multiInstallData as Hex).length)), { size: 4, dir: 'right' }),
    //     hexToBytes(multiInstallData as Hex),
    //     pad(toBytes(BigInt(hexToBytes(enableModeSig).length)), { size: 4, dir: 'right' }),
    //     hexToBytes(enableModeSig)
    //   ])

    //   userOp.signature = encodePacked(['bytes', 'bytes'], [toHex(enableModeSigPrefix), userOp.signature!]);

    //   const response = await smartAccount.sendUserOp(userOp);
    //   const receipt = await response.wait();

    //   console.log(receipt, "receipt");

    //   const counterAfter = await publicClient.readContract({
    //     address: counterAddress,
    //     abi: parseAbi(["function getCount() external view returns(uint256)"]),
    //     functionName: "getCount"
    //   })

    //   console.log(counterAfter, "counter after");
    // }, 60000)

    // test("Mint NFT's - Batch Call", async () => {
    //   const encodedCall = encodeFunctionData({
    //     abi: parseAbi(["function safeMint(address _to)"]),
    //     functionName: "safeMint",
    //     args: [recipient]
    //   })
    //   const transaction = {
    //     to: nftAddress, // NFT address
    //     data: encodedCall,
    //     value: 0n
    //   }
    //   const userOpResponse = await smartAccount.sendTransaction([
    //     transaction,
    //     transaction
    //   ])
    //   const userOpReceipt: UserOpReceipt = await userOpResponse.wait()
    //   console.log(userOpReceipt.userOpHash, "user op hash")

    //   expect(userOpReceipt.success).toBe(true)
    // }, 60000)
  })

  // describe("Account:Validation Module", async () => {
  // test("should install a dummy K1Validator module", async () => {
  //   const userOpReceipt = await smartAccount.installModule(K1_VALIDATOR, ModuleType.Validation, encodePacked(['address'], [await smartAccount.getAddress() as Hex]))
  //   const isInstalled = await smartAccount.isModuleInstalled(
  //     ModuleType.Validation,
  //     K1_VALIDATOR
  //   )
  //   expect(userOpReceipt.success).toBe(true)
  //   expect(isInstalled).toBeTruthy()
  // }, 60000)
  // test("should uninstall dummy K1Validator module", async () => {
  //   const newK1ValidatorContract =
  //     "0x26d3E02a086D5182F4921CF1917fe9E6462E0495"
  //   const prevAddress: Hex = "0x9C08e1CE188C29bAaeBc64A08cF2Ec44207749B6"
  //   const deInitData = encodeAbiParameters(
  //     [
  //       { name: "prev", type: "address" },
  //       { name: "disableModuleData", type: "bytes" }
  //     ],
  //     [prevAddress, toHex(stringToBytes(""))]
  //   )
  //   console.log(deInitData, "deInitData");
  // const userOpReceipt = await smartAccount.uninstallModule(newK1ValidatorContract, ModuleType.Validation, deInitData);
  // const isInstalled = await smartAccount.isModuleInstalled(
  //   ModuleType.Validation,
  //   newK1ValidatorContract
  // )
  // expect(userOpReceipt.success).toBe(true)
  // expect(isInstalled).toBeFalsy()
  // expect(userOpReceipt).toBeTruthy()
  // }, 60000)
  //   test("should fail to install an already installed Validator", async () => {
  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Validation,
  //       K1_VALIDATOR
  //     )
  //     expect(isInstalled).toBeTruthy()
  //     const receiptPromise = smartAccount.installModule(K1_VALIDATOR, ModuleType.Validation)
  //     await expect(receiptPromise).rejects.toThrowError("Error from Bundler:")
  //   }, 60000)
  // })

  // describe("Account:Execution Module Tests", async () => {
  // test("install a mock Execution module", async () => {
  //   const userOpReceipt = await smartAccount.installModule(K1_VALIDATOR, ModuleType.Validation)

  //   const isInstalled = await smartAccount.isModuleInstalled(
  //     ModuleType.Execution,
  //     MOCK_EXECUTOR
  //   )

  //   expect(userOpReceipt.success).toBe(true)
  //   expect(isInstalled).toBeTruthy()
  // }, 60000)

  // test("get installed executors", async () => {
  //   const installedExecutors: Address[] =
  //     await smartAccount.getInstalledExecutors()
  //   console.log(installedExecutors, "installed executors")
  //   expect(installedExecutors.includes(MOCK_EXECUTOR)).toBeTruthy()
  // }, 60000)

  // test("uninstall executor module", async () => {

  //   const isInstalledBefore = await smartAccount.isModuleInstalled(
  //     ModuleType.Execution,
  //     MOCK_EXECUTOR
  //   )
  //   console.log(isInstalledBefore, "isInstalledBefore");

  //   const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //   const deInitData = encodeAbiParameters(
  //     [
  //       { name: "prev", type: "address" },
  //       { name: "disableModuleData", type: "bytes" }
  //     ],
  //     [prevAddress, toHex(stringToBytes(""))]
  //   )
  //   const userOpReceipt = await smartAccount.uninstallModule(MOCK_EXECUTOR, ModuleType.Execution, deInitData)

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

  //   const userOpResponse = smartAccount.installModule(MOCK_EXECUTOR, ModuleType.Execution)
  //   await expect(userOpResponse).rejects.toThrowError("Error from Bundler:")
  // }, 60000)

  // test("send user op using the executor call type single", async () => {
  //   const authorizedOwners = await ownableExecutorModule.getOwners();
  //   expect(authorizedOwners).contains(await smartAccount.getAddress());

  //   const encodedCall = encodeFunctionData({
  //     abi: parseAbi(["function safeMint(address _to)"]),
  //     functionName: "safeMint",
  //     args: [recipient]
  //   })

  //   const transaction = {
  //     to: nftAddress,
  //     data: encodedCall
  //   }
  //   const userOpReceipt = await smartAccount.sendTransactionWithExecutor(
  //     transaction,
  //   )

  //   expect(userOpReceipt.success).toBeTruthy();
  // }, 60000)

  // test("send user op using the executor call type batch", async () => {
  //   const authorizedOwners = await ownableExecutorModule.getOwners()
  //   expect(authorizedOwners).contains(await smartAccount.getAddress())

  //   const encodedCall = encodeFunctionData({
  //     abi: parseAbi(["function safeMint(address _to)"]),
  //     functionName: "safeMint",
  //     args: [recipient]
  //   })
  //   const transaction = {
  //     to: nftAddress,
  //     data: encodedCall
  //   }
  //   const userOpReceipt = await smartAccount.sendTransactionWithExecutor([
  //     transaction,
  //     transaction
  //   ])

  //   expect(userOpReceipt.success).toBeTruthy()
  // }, 60000)
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

  //     const userOpReceipt = await smartAccount.installModule(MOCK_HOOK, ModuleType.Hooks)
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

  //   test("uninstall hook module", async () => {
  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = encodeAbiParameters(
  //       [
  //         { name: "prev", type: "address" },
  //         { name: "disableModuleData", type: "bytes" }
  //       ],
  //       [prevAddress, toHex(stringToBytes(""))]
  //     )
  //     const userOpReceipt = await smartAccount.uninstallModule(MOCK_HOOK, ModuleType.Hooks, deInitData)

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hooks,
  //       MOCK_HOOK
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)
  // })

  // describe("Account:Fallback Handler Module Tests", async () => {
  //   test("install a fallback handler Hook module", async () => {
  //     const isSupported = await smartAccount.supportsModule(ModuleType.Fallback)
  //     console.log(isSupported, "is supported")

  //     const isInstalledBefore = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER,
  //       ethers.AbiCoder.defaultAbiCoder().encode(
  //         ["bytes4"],
  //         [GENERIC_FALLBACK_SELECTOR as Hex]
  //       ) as Hex
  //     )
  //     console.log(isInstalledBefore, "is installed before")

  //     const userOpReceipt = await smartAccount.installModule(MOCK_FALLBACK_HANDLER, ModuleType.Fallback, ethers.AbiCoder.defaultAbiCoder().encode(
  //       ["bytes4"],
  //       [GENERIC_FALLBACK_SELECTOR as Hex]
  //     ) as Hex)

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER,
  //       ethers.AbiCoder.defaultAbiCoder().encode(
  //         ["bytes4"],
  //         [GENERIC_FALLBACK_SELECTOR as Hex]
  //       ) as Hex
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeTruthy()
  //   }, 60000)

  //   test("uninstall handler module", async () => {
  //     const prevAddress: Hex = "0x0000000000000000000000000000000000000001"
  //     const deInitData = ethers.AbiCoder.defaultAbiCoder().encode(
  //       ["bytes4"],
  //       [GENERIC_FALLBACK_SELECTOR as Hex]
  //     ) as Hex
  //     const userOpReceipt = await smartAccount.uninstallModule(
  //       MOCK_FALLBACK_HANDLER,
  //       ModuleType.Fallback,
  //       deInitData
  //     )

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Fallback,
  //       MOCK_FALLBACK_HANDLER,
  //       ethers.AbiCoder.defaultAbiCoder().encode(
  //         ["bytes4"],
  //         [GENERIC_FALLBACK_SELECTOR as Hex]
  //       ) as Hex
  //     )

  //     expect(userOpReceipt.success).toBe(true)
  //     expect(isInstalled).toBeFalsy()
  //     expect(userOpReceipt).toBeTruthy()
  //   }, 60000)
  // })
})
