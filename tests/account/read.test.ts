import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import {
  http,
  type Chain,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  hashMessage,
  parseAbi,
  parseAbiParameters
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { bsc } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ERROR_MESSAGES,
  compareChainIds,
  createSmartAccountClient,
  NATIVE_TOKEN_ALIAS
} from "../../src/account"
import { type UserOperationStruct, getChain } from "../../src/account"
import { BiconomyAccountAbi } from "../../src/account/abi/SmartAccount"
import { createBundler } from "../../src/bundler"
import {
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  createECDSAOwnershipValidationModule
} from "../../src/modules"
import {
  type FeeQuotesOrDataResponse,
  Paymaster,
  PaymasterMode
} from "../../src/paymaster"
import { checkBalance, getBundlerUrl, getConfig } from "../utils"

describe("Account: Read", () => {
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

  test.concurrent(
    "should get all modules",
    async () => {
      const modules = await smartAccount.getAllModules()
      expect(modules).toContain(DEFAULT_SESSION_KEY_MANAGER_MODULE) // session manager module
      expect(modules).toContain(DEFAULT_ECDSA_OWNERSHIP_MODULE) // ecdsa ownership module
    },
    30000
  )

  test.concurrent(
    "should check if module is enabled on the smart account",
    async () => {
      const isEnabled = await smartAccount.isModuleEnabled(
        DEFAULT_ECDSA_OWNERSHIP_MODULE
      )
      expect(isEnabled).toBeTruthy()
    },
    30000
  )

  test.concurrent(
    "should get disabled module data",
    async () => {
      const disableModuleData = await smartAccount.getDisableModuleData(
        DEFAULT_ECDSA_OWNERSHIP_MODULE,
        DEFAULT_ECDSA_OWNERSHIP_MODULE
      )
      expect(disableModuleData).toBeTruthy()
    },
    30000
  )

  test.concurrent(
    "should get setup and enable module data",
    async () => {
      const module = await createECDSAOwnershipValidationModule({
        signer: walletClient
      })
      const initData = await module.getInitData()
      const setupAndEnableModuleData =
        await smartAccount.getSetupAndEnableModuleData(
          DEFAULT_ECDSA_OWNERSHIP_MODULE,
          initData
        )
      expect(setupAndEnableModuleData).toBeTruthy()
    },
    30000
  )

  test.concurrent(
    "should create a smartAccountClient from an ethers signer",
    async () => {
      const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
      const ethersSigner = new Wallet(privateKey, ethersProvider)

      const smartAccount = await createSmartAccountClient({
        signer: ethersSigner,
        bundlerUrl,
        rpcUrl: chain.rpcUrls.default.http[0]
      })
      const address = await smartAccount.getAccountAddress()
      expect(address).toBeTruthy()
    }
  )

  test.concurrent(
    "should pickup the rpcUrl from viem wallet and ethers",
    async () => {
      const newRpcUrl = "http://localhost:8545"
      const defaultRpcUrl = chain.rpcUrls.default.http[0] //http://127.0.0.1:8545"

      const ethersProvider = new JsonRpcProvider(newRpcUrl)
      const ethersSignerWithNewRpcUrl = new Wallet(privateKey, ethersProvider)

      const originalEthersProvider = new JsonRpcProvider(
        chain.rpcUrls.default.http[0]
      )
      const ethersSigner = new Wallet(privateKey, originalEthersProvider)

      const accountOne = privateKeyToAccount(`0x${privateKey}`)
      const walletClientWithNewRpcUrl = createWalletClient({
        account: accountOne,
        chain,
        transport: http(newRpcUrl)
      })
      const [
        smartAccountFromEthersWithNewRpc,
        smartAccountFromViemWithNewRpc,
        smartAccountFromEthersWithOldRpc,
        smartAccountFromViemWithOldRpc
      ] = await Promise.all([
        createSmartAccountClient({
          chainId,
          signer: ethersSignerWithNewRpcUrl,
          bundlerUrl: getBundlerUrl(1337),
          rpcUrl: newRpcUrl
        }),
        createSmartAccountClient({
          chainId,
          signer: walletClientWithNewRpcUrl,
          bundlerUrl: getBundlerUrl(1337),
          rpcUrl: newRpcUrl
        }),
        createSmartAccountClient({
          chainId,
          signer: ethersSigner,
          bundlerUrl: getBundlerUrl(1337),
          rpcUrl: chain.rpcUrls.default.http[0]
        }),
        createSmartAccountClient({
          chainId,
          signer: walletClient,
          bundlerUrl: getBundlerUrl(1337),
          rpcUrl: chain.rpcUrls.default.http[0]
        })
      ])

      const [
        smartAccountFromEthersWithNewRpcAddress,
        smartAccountFromViemWithNewRpcAddress,
        smartAccountFromEthersWithOldRpcAddress,
        smartAccountFromViemWithOldRpcAddress
      ] = await Promise.all([
        smartAccountFromEthersWithNewRpc.getAccountAddress(),
        smartAccountFromViemWithNewRpc.getAccountAddress(),
        smartAccountFromEthersWithOldRpc.getAccountAddress(),
        smartAccountFromViemWithOldRpc.getAccountAddress()
      ])

      expect(
        [
          smartAccountFromEthersWithNewRpcAddress,
          smartAccountFromViemWithNewRpcAddress,
          smartAccountFromEthersWithOldRpcAddress,
          smartAccountFromViemWithOldRpcAddress
        ].every(Boolean)
      ).toBeTruthy()

      expect(smartAccountFromEthersWithNewRpc.rpcProvider.transport.url).toBe(
        newRpcUrl
      )
      expect(smartAccountFromViemWithNewRpc.rpcProvider.transport.url).toBe(
        newRpcUrl
      )
      expect(smartAccountFromEthersWithOldRpc.rpcProvider.transport.url).toBe(
        defaultRpcUrl
      )
      expect(smartAccountFromViemWithOldRpc.rpcProvider.transport.url).toBe(
        defaultRpcUrl
      )
    }
  )

  test.concurrent(
    "should parse the rpcUrl when a custom chain is used",
    async () => {
      const customBlastChain = {
        id: 81_457,
        name: "Blast",
        //   network: "blast",
        nativeCurrency: {
          decimals: 18,
          name: "Ethereum",
          symbol: "ETH"
        },
        rpcUrls: {
          public: { http: ["https://rpc.blast.io"] },
          default: { http: ["https://rpc.blast.io"] }
        },
        blockExplorers: {
          etherscan: { name: "Blastscan", url: "https://blastscan.io/" },
          default: { name: "Blastscan", url: "https://blastscan.io/" }
        },
        contracts: {
          multicall3: {
            address: "0xca11bde05977b3631167028862be2a173976ca11",
            blockCreated: 88_189
          }
        }
      } as const satisfies Chain

      const accountOne = privateKeyToAccount(`0x${privateKey}`)

      const walletClientWithCustomChain = createWalletClient({
        account: accountOne,
        chain: customBlastChain,
        transport: http(customBlastChain.rpcUrls.default.http[0])
      })

      const blastBundler = await createBundler({
        bundlerUrl: getBundlerUrl(customBlastChain.id),
        viemChain: customBlastChain
      })
      const smartAccountFromViemWithCustomChain =
        await createSmartAccountClient({
          viemChain: customBlastChain,
          signer: walletClientWithCustomChain,
          bundler: blastBundler,
          rpcUrl: customBlastChain.rpcUrls.default.http[0]
        })

      expect(
        smartAccountFromViemWithCustomChain.rpcProvider.transport.url
      ).toBe("https://rpc.blast.io")
      expect(blastBundler.getBundlerUrl()).toBe(
        getBundlerUrl(customBlastChain.id)
      )
    }
  )

  test.concurrent(
    "should read estimated user op gas values",
    async () => {
      const tx = {
        to: "0x000000D50C68705bd6897B2d17c7de32FB519fDA",
        data: "0x"
      }

      const userOp = await smartAccount.buildUserOp([tx])

      const estimatedGas = await smartAccount.estimateUserOpGas(userOp)
      expect(estimatedGas.maxFeePerGas).toBeTruthy()
      expect(estimatedGas.maxPriorityFeePerGas).toBeTruthy()
      expect(estimatedGas.verificationGasLimit).toBeTruthy()
      expect(estimatedGas.callGasLimit).toBeTruthy()
      expect(estimatedGas.preVerificationGas).toBeTruthy()
      expect(estimatedGas).toHaveProperty("paymasterAndData", "0x")
    },
    30000
  )

  test.concurrent("should have an active validation module", async () => {
    const module = smartAccount.activeValidationModule
    expect(module).toBeTruthy()
  })

  test.concurrent(
    "should create a smart account with paymaster by creating instance",
    async () => {
      const paymaster = new Paymaster({ paymasterUrl })

      const smartAccount = await createSmartAccountClient({
        signer: walletClient,
        bundlerUrl,
        paymaster
      })
      expect(smartAccount.paymaster).not.toBeNull()
      expect(smartAccount.paymaster).not.toBeUndefined()
    }
  )
  test.concurrent(
    "should fail to create a smartAccountClient from a walletClient without a chainId",
    async () => {
      const account = privateKeyToAccount(generatePrivateKey())
      const viemWalletClientNoChainId = createWalletClient({
        account,
        transport: http(chain.rpcUrls.default.http[0])
      })

      expect(
        await expect(
          createSmartAccountClient({
            signer: viemWalletClientNoChainId,
            bundlerUrl,
            rpcUrl: chain.rpcUrls.default.http[0]
          })
        ).rejects.toThrow("Cannot consume a viem wallet without a chainId")
      )
    }
  )

  test.concurrent(
    "should fail to create a smartAccountClient from a walletClient without an account",
    async () => {
      const viemWalletNoAccount = createWalletClient({
        transport: http(chain.rpcUrls.default.http[0])
      })

      expect(async () =>
        createSmartAccountClient({
          signer: viemWalletNoAccount,
          bundlerUrl,
          rpcUrl: chain.rpcUrls.default.http[0]
        })
      ).rejects.toThrow("Cannot consume a viem wallet without an account")
    }
  )

  test.concurrent("should have account addresses", async () => {
    const addresses = await Promise.all([
      sender,
      smartAccount.getAddress(),
      recipient,
      smartAccountTwo.getAddress()
    ])
    expect(addresses.every(Boolean)).toBeTruthy()
  })

  test.concurrent(
    "should create a smart account with paymaster with an api key",
    async () => {
      const paymaster = smartAccount.paymaster
      expect(paymaster).not.toBeNull()
      expect(paymaster).not.toBeUndefined()
    }
  )

  test.concurrent(
    "should expect several feeQuotes in resonse to empty tokenInfo fields",
    async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })

      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }

      const feeQuotesResponse = await smartAccount.getTokenFees(transaction, {
        paymasterServiceData: { mode: PaymasterMode.ERC20 }
      })
      expect(feeQuotesResponse.feeQuotes?.length).toBeGreaterThan(1)
    }
  )

  test.concurrent("should not throw and error, chain ids match", async () => {
    const mockBundlerUrl =
      "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
    const mockPaymasterUrl =
      "https://paymaster.biconomy.io/api/v1/80001/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

    const config: BiconomySmartAccountV2Config = {
      signer: walletClient,
      bundlerUrl: mockBundlerUrl,
      paymasterUrl: mockPaymasterUrl
    }

    await expect(
      compareChainIds(walletClient, config, false)
    ).resolves.not.toThrow()
  })

  test.concurrent(
    "should throw and error, bundlerUrl chain id and signer chain id does not match",
    async () => {
      const config: BiconomySmartAccountV2Config = {
        signer: walletClient,
        bundlerUrl: getBundlerUrl(1337),
        paymasterUrl
      }

      await expect(
        compareChainIds(walletClient, config, false)
      ).rejects.toThrow()
    }
  )
  test.concurrent(
    "should throw and error, bundlerUrl chain id and paymaster url chain id does not match",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

      const config: BiconomySmartAccountV2Config = {
        signer: walletClient,
        bundlerUrl,
        paymasterUrl: mockPaymasterUrl
      }

      await expect(
        compareChainIds(walletClient, config, false)
      ).rejects.toThrow()
    }
  )

  test.concurrent(
    "should throw and error, bundlerUrl chain id and paymaster url chain id does not match with validation module",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

      const ecdsaModule = await createECDSAOwnershipValidationModule({
        signer: walletClient
      })

      const config: BiconomySmartAccountV2Config = {
        defaultValidationModule: ecdsaModule,
        activeValidationModule: ecdsaModule,
        bundlerUrl,
        paymasterUrl: mockPaymasterUrl
      }

      await expect(
        compareChainIds(walletClient, config, false)
      ).rejects.toThrow()
    }
  )

  test.concurrent(
    "should throw and error, signer has chain id (56) and paymasterUrl has chain id (80001)",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/80001/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

      const walletClientBsc = createWalletClient({
        account: walletClient.account,
        chain: bsc,
        transport: http(bsc.rpcUrls.default.http[0])
      })

      const config: BiconomySmartAccountV2Config = {
        signer: walletClientBsc,
        bundlerUrl,
        paymasterUrl: mockPaymasterUrl
      }

      await expect(
        compareChainIds(walletClientBsc, config, false)
      ).rejects.toThrow()
    }
  )

  test.concurrent("should return chain object for chain id 1", async () => {
    const chainId = 1
    const chain = getChain(chainId)
    expect(chain.id).toBe(chainId)
  })

  test.concurrent("should have correct fields", async () => {
    const chainId = 1
    const chain = getChain(chainId)
    ;[
      "blockExplorers",
      "contracts",
      "fees",
      "formatters",
      "id",
      "name",
      "nativeCurrency",
      "rpcUrls",
      "serializers"
    ].every((field) => {
      expect(chain).toHaveProperty(field)
    })
  })

  test.concurrent("throw an error, chain id not found", async () => {
    const chainId = 0
    expect(() => getChain(chainId)).toThrow(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  })

  test.concurrent(
    "should have matching #getUserOpHash and entryPoint.getUserOpHash",
    async () => {
      const userOp: UserOperationStruct = {
        sender: "0x".padEnd(42, "1") as string,
        nonce: 2,
        initCode: "0x3333",
        callData: "0x4444",
        callGasLimit: 5,
        verificationGasLimit: 6,
        preVerificationGas: 7,
        maxFeePerGas: 8,
        maxPriorityFeePerGas: 9,
        paymasterAndData: "0xaaaaaa",
        signature: "0xbbbb"
      }

      const epHash = await publicClient.readContract({
        address: DEFAULT_ENTRYPOINT_ADDRESS,
        abi: [
          {
            inputs: [
              {
                components: [
                  { internalType: "address", name: "sender", type: "address" },
                  { internalType: "uint256", name: "nonce", type: "uint256" },
                  { internalType: "bytes", name: "initCode", type: "bytes" },
                  { internalType: "bytes", name: "callData", type: "bytes" },
                  {
                    internalType: "uint256",
                    name: "callGasLimit",
                    type: "uint256"
                  },
                  {
                    internalType: "uint256",
                    name: "verificationGasLimit",
                    type: "uint256"
                  },
                  {
                    internalType: "uint256",
                    name: "preVerificationGas",
                    type: "uint256"
                  },
                  {
                    internalType: "uint256",
                    name: "maxFeePerGas",
                    type: "uint256"
                  },
                  {
                    internalType: "uint256",
                    name: "maxPriorityFeePerGas",
                    type: "uint256"
                  },
                  {
                    internalType: "bytes",
                    name: "paymasterAndData",
                    type: "bytes"
                  },
                  { internalType: "bytes", name: "signature", type: "bytes" }
                ],
                internalType: "struct UserOperation",
                name: "userOp",
                type: "tuple"
              }
            ],
            name: "getUserOpHash",
            outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: "getUserOpHash",
        // @ts-ignore
        args: [userOp]
      })

      const hash = await smartAccount.getUserOpHash(userOp)
      expect(hash).toBe(epHash)
    },
    30000
  )

  test.concurrent(
    "should be deployed to counterfactual address",
    async () => {
      const accountAddress = await smartAccount.getAccountAddress()
      const byteCode = await publicClient.getBytecode({
        address: accountAddress as Hex
      })

      expect(byteCode?.length).toBeGreaterThan(2)
    },
    10000
  )

  test.concurrent(
    "should check if ecdsaOwnershipModule is enabled",
    async () => {
      const ecdsaOwnershipModule = "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e"

      expect(ecdsaOwnershipModule).toBe(
        smartAccount.activeValidationModule.getAddress()
      )
    }
  )

  test.concurrent(
    "should throw, chain id from signer and bundlerUrl do not match",
    async () => {
      const createAccount = createSmartAccountClient({
        signer: walletClient,
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44" // mock
      })

      await expect(createAccount).rejects.toThrow()
    }
  )

  test.concurrent(
    "should throw and error if missing field for ERC20 Paymaster user op",
    async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipient]
      })

      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }

      const feeQuotesResponse: FeeQuotesOrDataResponse =
        await smartAccount.getTokenFees(transaction, {
          paymasterServiceData: {
            mode: PaymasterMode.ERC20,
            preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977"
          }
        })

      expect(async () =>
        smartAccount.sendTransaction(transaction, {
          paymasterServiceData: {
            mode: PaymasterMode.ERC20,
            feeQuote: feeQuotesResponse.feeQuotes?.[0]
          },
          simulationType: "validation"
        })
      ).rejects.toThrow(ERROR_MESSAGES.SPENDER_REQUIRED)
    },
    60000
  )

  test.concurrent(
    "should throw, chain id from paymasterUrl and bundlerUrl do not match",
    async () => {
      const createAccount = createSmartAccountClient({
        signer: walletClient,
        paymasterUrl:
          "https://paymaster.biconomy.io/api/v1/1/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71",
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44" // mock
      })

      await expect(createAccount).rejects.toThrow()
    }
  )

  test.concurrent(
    "should fail to deploy a smart account if no native token balance or paymaster",
    async () => {
      const newPrivateKey = generatePrivateKey()
      const newAccount = privateKeyToAccount(newPrivateKey)

      const newViemWallet = createWalletClient({
        account: newAccount,
        chain,
        transport: http()
      })

      const smartAccount = await createSmartAccountClient({
        signer: newViemWallet,
        paymasterUrl,
        bundlerUrl
      })

      expect(async () => smartAccount.deploy()).rejects.toThrow(
        ERROR_MESSAGES.NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY
      )
    }
  )

  test.concurrent(
    "should get supported tokens from the paymaster",
    async () => {
      const tokens = await smartAccount.getSupportedTokens()

      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens[0]).toHaveProperty("tokenAddress")
      expect(tokens[0]).toHaveProperty("symbol")
      expect(tokens[0]).toHaveProperty("decimal")
      expect(tokens[0]).toHaveProperty("premiumPercentage")
      expect(tokens[0]).toHaveProperty("logoUrl")
    },
    60000
  )

  test.concurrent(
    "should fail to deploy a smart account if already deployed",
    async () => {
      expect(async () => smartAccount.deploy()).rejects.toThrow(
        ERROR_MESSAGES.ACCOUNT_ALREADY_DEPLOYED
      )
    },
    60000
  )

  test.concurrent("should fetch balances for smartAccount", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977"
    const usdcBalanceBefore = await checkBalance(
      publicClient,
      await smartAccount.getAddress(),
      usdt
    )
    const [usdtBalanceFromSmartAccount, ethBalanceFromSmartAccount] =
      await smartAccount.getBalances([usdt])

    expect(usdtBalanceFromSmartAccount.amount).toBeGreaterThan(0n)
    expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n)
    expect(usdtBalanceFromSmartAccount.address).toBe(usdt)
    expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS)
    expect(usdtBalanceFromSmartAccount.chainId).toBe(chainId)
    expect(ethBalanceFromSmartAccount.chainId).toBe(chainId)
    expect(usdtBalanceFromSmartAccount.decimals).toBe(6)
    expect(ethBalanceFromSmartAccount.decimals).toBe(18)
    expect(usdtBalanceFromSmartAccount.formattedAmount).toBeTruthy()
    expect(ethBalanceFromSmartAccount.formattedAmount).toBeTruthy()
  })

  test("should error if no recipient exists", async () => {
    const usdt: Hex = "0xda5289fcaaf71d52a80a254da614a192b693e977"
    const smartAccountOwner = walletClient.account.address

    const txs = [
      { address: usdt, amount: BigInt(1), recipient: smartAccountOwner },
      { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
    ]

    expect(async () => smartAccount.withdraw(txs)).rejects.toThrow(
      ERROR_MESSAGES.NO_RECIPIENT
    )
  })

  test("should error when withdraw all of native token is attempted without an amount explicitly set", async () => {
    const smartAccountOwner = walletClient.account.address
    expect(async () =>
      smartAccount.withdraw(null, smartAccountOwner)
    ).rejects.toThrow(ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT)
  }, 6000)

  test.concurrent(
    "should check native token balance for smartAccount",
    async () => {
      const [ethBalanceFromSmartAccount] = await smartAccount.getBalances()

      expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n)
      expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS)
      expect(ethBalanceFromSmartAccount.chainId).toBe(chainId)
      expect(ethBalanceFromSmartAccount.decimals).toBe(18)
    },
    60000
  )

  test.concurrent(
    "should verify a correct signature through isValidSignature",
    async () => {
      const eip1271MagicValue = "0x1626ba7e"
      const message = "Some message from dApp"
      const messageHash = hashMessage(message)
      const signature = await smartAccount.signMessage(messageHash)

      const response = await publicClient.readContract({
        address: await smartAccount.getAccountAddress(),
        abi: BiconomyAccountAbi,
        functionName: "isValidSignature",
        args: [messageHash, signature]
      })

      expect(response).toBe(eip1271MagicValue)
    }
  )

  test.concurrent("should confirm that signature is not valid", async () => {
    const randomPrivKey = generatePrivateKey()
    const randomWallet = privateKeyToAccount(randomPrivKey)

    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl
    })

    const eip1271MagicValue = "0xffffffff"
    const message = "Some message from dApp"
    const messageHash = hashMessage(message)
    const signature = await randomWallet.signMessage({ message: messageHash })
    const signatureWithModuleAddress = encodeAbiParameters(
      parseAbiParameters("bytes, address"),
      [signature, smartAccount.defaultValidationModule.getAddress()]
    )

    const response = await publicClient.readContract({
      address: await smartAccount.getAccountAddress(),
      abi: BiconomyAccountAbi,
      functionName: "isValidSignature",
      args: [messageHash, signatureWithModuleAddress]
    })

    expect(response).toBe(eip1271MagicValue)
  })
})
