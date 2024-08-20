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
  parseEther,
  stringToBytes,
  toBytes,
  toHex
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect, test } from "vitest"
import {
  GENERIC_FALLBACK_SELECTOR,
  K1_VALIDATOR,
  MOCK_EXECUTOR,
  MOCK_FALLBACK_HANDLER,
  MOCK_HOOK,
  MODE_MODULE_ENABLE,
  MODULE_TYPE_MULTI,
  createK1ValidatorModule,
  createOwnableExecutorModule,
  makeInstallDataAndHash,
  moduleTypeIds
} from "../../src"
import { createSmartAccountClient } from "../../src/account"
import type { UserOpReceipt } from "../../src/bundler"
import { getConfig } from "../utils"

describe("Account:Write", async () => {
  const nonceOptions = { nonceKey: BigInt(Date.now() + 10) }
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x69835C1f31ed0721A05d5711C1d669C10802a3E1"
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
  smartAccount.setActiveExecutionModule(ownableExecutorModule)

  const k1Validator = await createK1ValidatorModule(smartAccount.getSigner())

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

    test("Mint NFT - Single Call", async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })

      const isInstalled = await smartAccount.isModuleInstalled({type: k1Validator.type, moduleAddress: k1Validator.moduleAddress, data: k1Validator.data});
      console.log(isInstalled);

      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }

      const response = await smartAccount.sendTransaction([transaction])
      console.log(response, "response")

      const receipt = await response.wait()
      console.log(receipt, "receipt")

      expect(receipt.userOpHash).toBeTruthy()
    }, 60000)

    test.skip("Use enable mode", async () => {
      const counterAddress = "0x6BFE41FF0605a87911c0542bF958691ea2ac77f8" // base baseSepolia

      const counterBefore = await publicClient.readContract({
        address: counterAddress,
        abi: parseAbi(["function getCount() external view returns(uint256)"]),
        functionName: "getCount"
      })

      console.log(counterBefore, "counter before")

      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function increment() external view returns(uint256)"]),
        functionName: "increment"
      })
      const userOp = await smartAccount.buildUserOp(
        [{ to: counterAddress, data: encodedCall }],
        { nonceOptions: { validationMode: MODE_MODULE_ENABLE } }
      )

      // Prepare Enable Mode Data
      const validatorConfig = pad(
        toBytes("0xdB9426d6cE27071b3a806f95B0d9430455d4d4c6"),
        { size: 32 }
      )
      const executorConfig = pad(hexToBytes("0x2222"), { size: 32 })

      const validatorInstallData = concat([
        toBytes(moduleTypeIds['validator']),
        validatorConfig
      ])

      const executorInstallData = concat([
        toBytes(moduleTypeIds['executor']),
        executorConfig
      ])

      const [multiInstallData, hashToSign] = makeInstallDataAndHash(
        walletClient.account?.address,
        [
          {
            moduleType: 'validator',
            config: toHex(validatorInstallData)
          },
          {
            moduleType: 'executor',
            config: toHex(executorInstallData)
          }
        ]
      )
      const enableModeSig = encodePacked(
        ["address", "bytes"],
        [K1_VALIDATOR, await smartAccount.signMessage(hashToSign)]
      )

      const enableModeSigPrefix = concat([
        toBytes(MODULE_TYPE_MULTI),
        pad(toBytes(BigInt(hexToBytes(multiInstallData as Hex).length)), {
          size: 4,
          dir: "right"
        }),
        hexToBytes(multiInstallData as Hex),
        pad(toBytes(BigInt(hexToBytes(enableModeSig).length)), {
          size: 4,
          dir: "right"
        }),
        hexToBytes(enableModeSig)
      ])

      userOp.signature = encodePacked(['bytes', 'bytes'], [toHex(enableModeSigPrefix), userOp.signature!]);

      const response = await smartAccount.sendUserOp(userOp);
      const receipt = await response.wait();

      console.log(receipt, "receipt");

      const counterAfter = await publicClient.readContract({
        address: counterAddress,
        abi: parseAbi(["function getCount() external view returns(uint256)"]),
        functionName: "getCount"
      })

      console.log(counterAfter, "counter after");
    }, 60000)

    test("Mint NFT's - Batch Call", async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })
      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall,
        value: 0n
      }
      const userOpResponse = await smartAccount.sendTransaction([
        transaction,
        transaction
      ])
      const userOpReceipt: UserOpReceipt = await userOpResponse.wait()
      console.log(userOpReceipt.userOpHash, "user op hash")

      expect(userOpReceipt.success).toBe(true)
    }, 60000)
  })

  // describe("Account:Hook Module Tests", async () => {
  //   test("install a mock Hook module", async () => {
  //     const isSupported = await smartAccount.supportsModule(ModuleType.Hook)
  //     console.log(isSupported, "is supported")

  //     const isInstalledBefore = await smartAccount.isModuleInstalled(
  //       ModuleType.Hook,
  //       MOCK_HOOK
  //     )
  //     console.log(isInstalledBefore, "is installed before")

  //     const userOpReceipt = await smartAccount.installModule(MOCK_HOOK, ModuleType.Hook)
  //     console.log(userOpReceipt, "user op receipt")

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hook,
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
  //     const userOpReceipt = await smartAccount.uninstallModule(MOCK_HOOK, ModuleType.Hook, deInitData)

  //     const isInstalled = await smartAccount.isModuleInstalled(
  //       ModuleType.Hook,
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
