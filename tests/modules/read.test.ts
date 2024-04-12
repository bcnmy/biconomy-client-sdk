import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import {
  http,
  createWalletClient,
  encodeAbiParameters,
  parseAbiParameters
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient
} from "../../src/account"
import {
  createECDSAOwnershipValidationModule,
  createMultiChainValidationModule
} from "../../src/modules"
import { getConfig } from "../utils"
import { defaultAbiCoder } from "@ethersproject/abi"

describe("Modules: Read", () => {
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
  })

  test.concurrent("should encode params successfully", async () => {
    const hardcodedPaddedSignature =
      "0x000000000000000000000000000002fbffedd9b33f4e7156f2de8d48945e74890000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d50c68705bd6897b2d17c7de32fb519fda00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000fa66e705cf2582cf56528386bb9dfca119767262000000000000000000000000da5289fcaaf71d52a80a254da614a192b693e9770000000000000000000000003079b249dfde4692d7844aa261f8cf7d927a0da500000000000000000000000000000000000000000000000000000000009896800000000000000000000000000000000000000000000000000000000000000003ca2b0ef4564d7ca7044b8c9d75685659975c0cab591408cb20e4a2ab278ab282633eb23075a8cb9bc5b01a5a4fa367b73da76821105f67a62ed7eedd335f6c0e361e73015ce4bb83439ab0742bdfed338ec39e2e8dd0819528f02be218fc1db90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007ba4a7338d7a90dfa465cf975cc6691812c3772e00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000020000000000000000000000000fa66e705cf2582cf56528386bb9dfca1197672620000000000000000000000000000000000000000000000000000000000000003b91f47666ba9b0b6b2cfbb60bf39b241d269786aa01f388021057d080863dd40633eb23075a8cb9bc5b01a5a4fa367b73da76821105f67a62ed7eedd335f6c0e361e73015ce4bb83439ab0742bdfed338ec39e2e8dd0819528f02be218fc1db90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004173c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b00000000000000000000000000000000000000000000000000000000000000"

    const sessionKeyManagerAddress =
      "0x000002FbFfedd9B33F4E7156F2DE8D48945E7489"
    const mockEcdsaSessionKeySig =
      "0x73c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b"
    const sessionDataTupleArray = [
      [
        0n,
        0n,
        "0x000000d50c68705bd6897b2d17c7de32fb519fda",
        "0x000000000000000000000000fa66e705cf2582cf56528386bb9dfca119767262000000000000000000000000da5289fcaaf71d52a80a254da614a192b693e9770000000000000000000000003079b249dfde4692d7844aa261f8cf7d927a0da50000000000000000000000000000000000000000000000000000000000989680",
        [
          "0xca2b0ef4564d7ca7044b8c9d75685659975c0cab591408cb20e4a2ab278ab282",
          "0x633eb23075a8cb9bc5b01a5a4fa367b73da76821105f67a62ed7eedd335f6c0e",
          "0x361e73015ce4bb83439ab0742bdfed338ec39e2e8dd0819528f02be218fc1db9"
        ],
        "0x"
      ],
      [
        0n,
        0n,
        "0x7ba4a7338d7a90dfa465cf975cc6691812c3772e",
        "0x000000000000000000000000fa66e705cf2582cf56528386bb9dfca119767262",
        [
          "0xb91f47666ba9b0b6b2cfbb60bf39b241d269786aa01f388021057d080863dd40",
          "0x633eb23075a8cb9bc5b01a5a4fa367b73da76821105f67a62ed7eedd335f6c0e",
          "0x361e73015ce4bb83439ab0742bdfed338ec39e2e8dd0819528f02be218fc1db9"
        ],
        "0x"
      ]
    ]

    const paddedSignature = defaultAbiCoder.encode(
      [
        "address",
        "tuple(uint48,uint48,address,bytes,bytes32[],bytes)[]",
        "bytes"
      ],
      [sessionKeyManagerAddress, sessionDataTupleArray, mockEcdsaSessionKeySig]
    )

    const abiParameters = [
      { type: "address" },
      {
        type: "tuple[]",
        components: [
          { type: "uint48" },
          { type: "uint48" },
          { type: "address" },
          { type: "bytes" },
          { type: "bytes32[]" },
          { type: "bytes" }
        ]
      },
      { type: "bytes" }
    ]

    const paddedSignatureWithViem = encodeAbiParameters(abiParameters, [
      sessionKeyManagerAddress,
      sessionDataTupleArray,
      mockEcdsaSessionKeySig
    ])

    expect(paddedSignature).toEqual(hardcodedPaddedSignature)
    expect(paddedSignatureWithViem).toEqual(hardcodedPaddedSignature)
  })

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule with signer",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      // Should not require a signer or chainId
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule,
        signer: walletClient
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      expect(smartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    }
  )

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule without signer",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      // Should not require a signer or chainId
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      expect(smartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    }
  )

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule by default, without explicitly setting it on the smart account",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        signer: walletClient
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      const smartAccountValidationModuleAddress =
        await smartAccount.activeValidationModule.getAddress()
      expect(smartAccountValidationModuleAddress).toEqual(
        defaultValidationModule.moduleAddress
      )
    }
  )

  test.concurrent(
    "should create a MultiChainValidationModule from an ethers signer using convertSigner",
    async () => {
      const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
      const ethersSigner = new Wallet(privateKey, ethersProvider)

      const defaultValidationModule = await createMultiChainValidationModule({
        signer: ethersSigner
      })
      // Should not require a signer or chainId
      const newSmartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule,
        rpcUrl: chain.rpcUrls.default.http[0]
      })

      const address = await newSmartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      // expect the relevant module to be set
      expect(newSmartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    },
    50000
  )

  test.concurrent(
    "should create a ECDSAOwnershipValidationModule from a viem signer using convertSigner",
    async () => {
      const defaultValidationModule =
        await createECDSAOwnershipValidationModule({
          signer: walletClient
        })
      // Should not require a signer or chainId
      const smartAccount = await createSmartAccountClient({
        bundlerUrl,
        defaultValidationModule,
        rpcUrl: chain.rpcUrls.default.http[0]
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
      // expect the relevant module to be set
      expect(smartAccount.activeValidationModule).toEqual(
        defaultValidationModule
      )
    },
    50000
  )
})
