import { JsonRpcProvider, ParamType, Wallet, ethers } from "ethers"
import {
  http,
  type AbiParameter,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  concat,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  hashMessage,
  keccak256,
  parseAbiParameters,
  toBytes,
  toHex
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { K1ValidatorFactoryAbi, NexusAbi } from "../src/__contracts/abi"
import addresses from "../src/__contracts/addresses"
import {
  ERROR_MESSAGES,
  NATIVE_TOKEN_ALIAS,
  type NexusSmartAccount,
  type SupportedSigner,
  type Transaction,
  createSmartAccountClient,
  eip1271MagicValue,
  getChain,
  makeInstallDataAndHash
} from "../src/account"
import { CounterAbi } from "./src/__contracts/abi"
import mockAddresses from "./src/__contracts/mockAddresses"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  checkBalance,
  getAccountDomainStructFields,
  getBundlerUrl,
  getTestAccount,
  killNetwork,
  pKey,
  toTestClient,
  topUp
} from "./src/testUtils"
import type {
  MasterClient,
  NetworkConfig,
  NetworkConfigWithBundler
} from "./src/testUtils"

const NETWORK_TYPE: TestFileNetworkType = "COMMON_LOCALHOST"

describe("account.read", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient

  // Test utils
  let testClient: MasterClient
  let account: Account
  let recipientAccount: Account
  let smartAccount: NexusSmartAccount
  let smartAccountAddress: Hex

  beforeAll(async () => {
    network = (await toNetwork(NETWORK_TYPE)) as NetworkConfig

    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = getTestAccount(0)
    recipientAccount = getTestAccount(3)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, getTestAccount(0))

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain
    })

    smartAccountAddress = await smartAccount.getAddress()
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should fund the smart account", async () => {
    await topUp(testClient, smartAccountAddress)
    const [balance] = await smartAccount.getBalances()
    expect(balance.amount > 0)
  })

  test("should have account addresses", async () => {
    const addresses = await Promise.all([
      account.address,
      smartAccount.getAddress()
    ])
    expect(addresses.every(Boolean)).to.be.true
    expect(addresses).toStrictEqual([
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0xa3962DB24D3cAb711e18d5A508591C6dB82a0f54" // Sender smart account
    ])
  })

  test.skip("should estimate gas for minting an NFT", async () => {
    const encodedCall = encodeFunctionData({
      abi: CounterAbi,
      functionName: "incrementNumber"
    })
    const transaction = {
      to: mockAddresses.Counter,
      data: encodedCall
    }
    const results = await Promise.all([
      smartAccount.getGasEstimate([transaction]),
      smartAccount.getGasEstimate([transaction, transaction])
    ])

    const increasingGasExpenditure = results.every(
      (result, i) => result > (results[i - 1] ?? 0)
    )

    expect(increasingGasExpenditure).toBeTruthy()
  }, 60000)

  test.skip("should throw if PrivateKeyAccount is used as signer and rpcUrl is not provided", async () => {
    const createSmartAccount = createSmartAccountClient({
      chain,
      signer: account as SupportedSigner,
      bundlerUrl
    })

    await expect(createSmartAccount).rejects.toThrow(
      ERROR_MESSAGES.MISSING_RPC_URL
    )
  }, 50000)

  test.skip("should get all modules", async () => {
    const modules = smartAccount.getInstalledModules()
    if (await smartAccount.isAccountDeployed()) {
      expect(modules).resolves
    } else {
      expect(modules).rejects.toThrow("Account is not deployed")
    }
  }, 30000)

  test.skip("should check if module is enabled on the smart account", async () => {
    const isEnabled = smartAccount.isModuleInstalled({
      type: "validator",
      moduleAddress: addresses.K1Validator
    })
    if (await smartAccount.isAccountDeployed()) {
      expect(isEnabled).resolves.toBeTruthy()
    } else {
      expect(isEnabled).rejects.toThrow("Account is not deployed")
    }
  }, 30000)

  test.skip("enable mode", async () => {
    const result = makeInstallDataAndHash(account.address, [
      {
        moduleType: "validator",
        config: account.address
      }
    ])
    expect(result).toBeTruthy()
  }, 30000)

  test.skip("should create a smartAccountClient from an ethers signer", async () => {
    const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
    const ethersSigner = new Wallet(pKey, ethersProvider)

    const smartAccount = await createSmartAccountClient({
      chain,
      signer: ethersSigner,
      bundlerUrl,
      rpcUrl: chain.rpcUrls.default.http[0]
    })
  })

  test.skip("should pickup the rpcUrl from viem wallet and ethers", async () => {
    const newRpcUrl = "http://localhost:8545"
    const defaultRpcUrl = chain.rpcUrls.default.http[0] //http://127.0.0.1:8545"

    const ethersProvider = new JsonRpcProvider(newRpcUrl)
    const ethersSignerWithNewRpcUrl = new Wallet(pKey, ethersProvider)

    const originalEthersProvider = new JsonRpcProvider(
      chain.rpcUrls.default.http[0]
    )
    const ethersSigner = new Wallet(pKey, originalEthersProvider)

    const walletClientWithNewRpcUrl = createWalletClient({
      account,
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
        chain,
        signer: ethersSignerWithNewRpcUrl,
        bundlerUrl: getBundlerUrl(1337),
        rpcUrl: newRpcUrl
      }),
      createSmartAccountClient({
        chain,
        signer: walletClientWithNewRpcUrl,
        bundlerUrl: getBundlerUrl(1337),
        rpcUrl: newRpcUrl
      }),
      createSmartAccountClient({
        chain,
        signer: ethersSigner,
        bundlerUrl: getBundlerUrl(1337),
        rpcUrl: chain.rpcUrls.default.http[0]
      }),
      createSmartAccountClient({
        chain,
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

    expect(smartAccountFromEthersWithNewRpc.publicClient.transport.url).toBe(
      newRpcUrl
    )
    expect(smartAccountFromViemWithNewRpc.publicClient.transport.url).toBe(
      newRpcUrl
    )
    expect(smartAccountFromEthersWithOldRpc.publicClient.transport.url).toBe(
      defaultRpcUrl
    )
    expect(smartAccountFromViemWithOldRpc.publicClient.transport.url).toBe(
      defaultRpcUrl
    )
  })

  test.skip("should read estimated user op gas values", async () => {
    const tx = {
      to: recipientAccount.address,
      data: "0x"
    }

    const userOp = await smartAccount.buildUserOp([tx])

    const estimatedGas = await smartAccount.estimateUserOpGas(userOp)
    expect(estimatedGas.maxFeePerGas).toBeTruthy()
    expect(estimatedGas.maxPriorityFeePerGas).toBeTruthy()
    expect(estimatedGas.verificationGasLimit).toBeTruthy()
    expect(estimatedGas.callGasLimit).toBeTruthy()
    expect(estimatedGas.preVerificationGas).toBeTruthy()
  }, 30000)

  test.skip("should have an active validation module", async () => {
    const module = smartAccount.activeValidationModule
    expect(module).toBeTruthy()
  })

  // @note Ignored untill we implement Paymaster
  // test.skip(
  //   "should create a smart account with paymaster by creating instance",
  //   async () => {
  //     const paymaster = new Paymaster({ paymasterUrl })

  //     const smartAccount = await createSmartAccountClient({
  //       signer: walletClient,
  //       bundlerUrl,
  //       paymaster
  //     })
  //     expect(smartAccount.paymaster).not.toBeNull()
  //     expect(smartAccount.paymaster).not.toBeUndefined()
  //   }
  // )

  test.skip("should fail to create a smartAccountClient from a walletClient without an account", async () => {
    const viemWalletNoAccount = createWalletClient({
      transport: http(chain.rpcUrls.default.http[0])
    })

    expect(async () =>
      createSmartAccountClient({
        chain,
        signer: viemWalletNoAccount,
        bundlerUrl,
        rpcUrl: chain.rpcUrls.default.http[0]
      })
    ).rejects.toThrow("Cannot consume a viem wallet without an account")
  })

  // test.skip(
  //   "should create a smart account with paymaster with an api key",
  //   async () => {
  //     const paymaster = smartAccount.paymaster
  //     expect(paymaster).not.toBeNull()
  //     expect(paymaster).not.toBeUndefined()
  //   }
  // )

  // test.skip("should not throw and error, chain ids match", async () => {
  //   const mockBundlerUrl =
  //     "https://bundler.biconomy.io/api/v2/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
  //   const mockPaymasterUrl =
  //     "https://paymaster.biconomy.io/api/v1/84532/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

  //   const config: NexusSmartAccountConfig = {
  //     signer: walletClient,
  //     bundlerUrl: mockBundlerUrl,
  //     paymasterUrl: mockPaymasterUrl
  //   }

  //   await expect(
  //     compareChainIds(walletClient, config, false)
  //   ).resolves.not.toThrow()
  // })

  // test.skip(
  //   "should throw and error, bundlerUrl chain id and paymaster url chain id does not match with validation module",
  //   async () => {
  //     const mockPaymasterUrl =
  //       "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

  //     const k1ValidationModule = await createK1ValidatorModule(
  //       smartAccount.getSigner()
  //     )

  //     const config: NexusSmartAccountConfig = {
  //       chain,
  //       defaultValidationModule: k1ValidationModule,
  //       activeValidationModule: k1ValidationModule,
  //       bundlerUrl,
  //       paymasterUrl: mockPaymasterUrl
  //     }

  //   }
  // )

  // test.skip(
  //   "should throw and error, signer has chain id (56) and paymasterUrl has chain id (11155111)",
  //   async () => {
  //     const mockPaymasterUrl =
  //       "https://paymaster.biconomy.io/api/v1/11155111/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

  //     const walletClientBsc = createWalletClient({
  //       account: walletClient.account,
  //       chain: bsc,
  //       transport: http(bsc.rpcUrls.default.http[0])
  //     })

  //     const config: NexusSmartAccountConfig = {
  //       chain,
  //       signer: walletClientBsc,
  //       bundlerUrl,
  //       paymasterUrl: mockPaymasterUrl
  //     }

  //   }
  // )

  test.skip("should return chain object for chain id 1", async () => {
    const chainId = 1
    const chain = getChain(chainId)
    expect(chain.id).toBe(chainId)
  })

  test.skip("should have correct fields", async () => {
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

  test.skip("should throw an error, chain id not found", async () => {
    const chainId = 0
    expect(() => getChain(chainId)).toThrow(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  })

  test.skip("should have matching counterFactual address from the contracts with smartAccount.getAddress()", async () => {
    const client = createWalletClient({
      account,
      chain,
      transport: http()
    })

    const smartAccount = await createSmartAccountClient({
      chain,
      signer: client,
      bundlerUrl
    })

    const smartAccountAddressFromSDK = await smartAccount.getAccountAddress()

    const publicClient = createPublicClient({
      chain,
      transport: http()
    })

    const factoryContract = getContract({
      address: addresses.K1ValidatorFactory,
      abi: K1ValidatorFactoryAbi,
      client: { public: publicClient, wallet: client }
    })

    const smartAccountAddressFromContracts =
      await factoryContract.read.computeAccountAddress([
        await smartAccount.getSmartAccountOwner().getAddress(),
        BigInt(0),
        [],
        0
      ])

    expect(smartAccountAddressFromSDK).toBe(smartAccountAddressFromContracts)
  })

  test.skip("should be deployed to counterfactual address", async () => {
    const accountAddress = await smartAccount.getAccountAddress()
    const byteCode = await testClient.getBytecode({
      address: accountAddress as Hex
    })
    if (await smartAccount.isAccountDeployed()) {
      expect(byteCode?.length).toBeGreaterThan(2)
    } else {
      expect(byteCode?.length).toBe(undefined)
    }
  }, 10000)

  test.skip("should check if ecdsaOwnershipModule is enabled", async () => {
    const ecdsaOwnershipModule = addresses.K1Validator

    expect(ecdsaOwnershipModule).toBe(
      smartAccount.activeValidationModule.getAddress()
    )
  })

  test.skip("should fail to deploy a smart account if no native token balance or paymaster", async () => {
    const newPrivateKey = generatePrivateKey()
    const newAccount = privateKeyToAccount(newPrivateKey)

    const newViemWallet = createWalletClient({
      account: newAccount,
      chain,
      transport: http()
    })

    const smartAccount = await createSmartAccountClient({
      chain,
      signer: newViemWallet,
      bundlerUrl
    })

    expect(async () => smartAccount.deploy()).rejects.toThrow(
      ERROR_MESSAGES.NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY
    )
  })

  test.skip("should fail to deploy a smart account if already deployed", async () => {
    if (await smartAccount.isAccountDeployed()) {
      expect(async () => smartAccount.deploy()).rejects.toThrow(
        ERROR_MESSAGES.ACCOUNT_ALREADY_DEPLOYED
      )
    } else {
      expect(smartAccount.deploy()).resolves
    }
  }, 60000)

  test.skip("should fetch balances for smartAccount", async () => {
    const token = "0x69835C1f31ed0721A05d5711C1d669C10802a3E1"
    const tokenBalanceBefore = await checkBalance(
      testClient,
      smartAccountAddress,
      token
    )
    const [tokenBalanceFromSmartAccount] = await smartAccount.getBalances([
      token
    ])

    expect(tokenBalanceBefore).toBe(tokenBalanceFromSmartAccount.amount)
  })

  test.skip("should error if no recipient exists", async () => {
    const token: Hex = "0x69835C1f31ed0721A05d5711C1d669C10802a3E1"

    const txs = [
      { address: token, amount: BigInt(1), recipient: account.address },
      { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
    ]

    expect(async () => smartAccount.withdraw(txs)).rejects.toThrow(
      ERROR_MESSAGES.NO_RECIPIENT
    )
  })

  test.skip("should error when withdraw all of native token is attempted without an amount explicitly set", async () => {
    expect(async () =>
      smartAccount.withdraw(null, account.address)
    ).rejects.toThrow(ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT)
  }, 6000)

  test.skip("should check native token balance and more token info for smartAccount", async () => {
    const [ethBalanceFromSmartAccount] = await smartAccount.getBalances()

    expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n)
    expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS)
    expect(ethBalanceFromSmartAccount.chainId).toBe(chain.id)
    expect(ethBalanceFromSmartAccount.decimals).toBe(18)
  }, 60000)

  // @note Skip until we implement the Paymaster
  // test.skip(
  //   "should check balance of supported token",
  //   async () => {
  //     const tokens = await smartAccount.getSupportedTokens()
  //     const [firstToken] = tokens

  //     expect(tokens.length).toBeGreaterThan(0)
  //     expect(tokens[0]).toHaveProperty("balance")
  //     expect(firstToken.balance.amount).toBeGreaterThanOrEqual(0n)
  //   },
  //   60000
  // )

  // @note Nexus SA signature needs to contain the validator module address in the first 20 bytes
  test.skip("should test isValidSignature PersonalSign to be valid", async () => {
    if (await smartAccount.isAccountDeployed()) {
      const data = hashMessage("0x1234")

      // Define constants as per the original Solidity function
      const DOMAIN_NAME = "Nexus"
      const DOMAIN_VERSION = "1.0.0-beta"
      const DOMAIN_TYPEHASH =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
      const PARENT_TYPEHASH = "PersonalSign(bytes prefixed)"
      const chainId = baseSepolia.id

      // Calculate the domain separator
      const domainSeparator = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32, bytes32, uint256, address"),
          [
            keccak256(toBytes(DOMAIN_TYPEHASH)),
            keccak256(toBytes(DOMAIN_NAME)),
            keccak256(toBytes(DOMAIN_VERSION)),
            BigInt(chainId),
            smartAccountAddress
          ]
        )
      )

      // Calculate the parent struct hash
      const parentStructHash = keccak256(
        encodeAbiParameters(parseAbiParameters("bytes32, bytes32"), [
          keccak256(toBytes(PARENT_TYPEHASH)),
          hashMessage(data)
        ])
      )

      // Calculate the final hash
      const resultHash: Hex = keccak256(
        concat(["0x1901", domainSeparator, parentStructHash])
      )

      const signature = await smartAccount.signMessage(resultHash)

      const contractResponse = await testClient.readContract({
        address: await smartAccount.getAddress(),
        abi: NexusAbi,
        functionName: "isValidSignature",
        args: [hashMessage(data), signature]
      })

      const viemResponse = await testClient.verifyMessage({
        address: smartAccountAddress,
        message: data,
        signature
      })

      expect(contractResponse).toBe(eip1271MagicValue)
      expect(viemResponse).toBe(true)
    }
  })

  test.skip("should test isValidSignature EIP712Sign to be valid", async () => {
    if (await smartAccount.isAccountDeployed()) {
      const data = keccak256("0x1234")

      // Define constants as per the original Solidity function
      const DOMAIN_NAME = "Nexus"
      const DOMAIN_VERSION = "1.0.0-beta"
      const DOMAIN_TYPEHASH =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
      const PARENT_TYPEHASH =
        "TypedDataSign(Contents contents,bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions) Contents(bytes32 stuff)"
      const chainId = baseSepolia.id

      // Calculate the domain separator
      const domainSeparator = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32, bytes32, uint256, address"),
          [
            keccak256(toBytes(DOMAIN_TYPEHASH)),
            keccak256(toBytes(DOMAIN_NAME)),
            keccak256(toBytes(DOMAIN_VERSION)),
            BigInt(chainId),
            smartAccountAddress
          ]
        )
      )

      const encodedAccountDomainStructFields =
        await getAccountDomainStructFields(testClient, smartAccountAddress)

      // Calculate the parent struct hash
      const parentStructHash = keccak256(
        encodePacked(
          ["bytes", "bytes"],
          [
            encodeAbiParameters(parseAbiParameters("bytes32, bytes32"), [
              keccak256(toBytes(PARENT_TYPEHASH)),
              hashMessage(data)
            ]),
            encodedAccountDomainStructFields
          ]
        )
      )

      const dataToSign: Hex = keccak256(
        concat(["0x1901" as Hex, domainSeparator, parentStructHash])
      )

      let signature = await smartAccount.signMessage(dataToSign)
      const contentsType: Hex = toHex("Contents(bytes32 stuff)")
      signature = encodePacked(
        ["bytes", "bytes", "bytes", "bytes", "uint"],
        [
          signature,
          domainSeparator,
          hashMessage(data),
          contentsType,
          BigInt(contentsType.length)
        ]
      )

      const finalSignature = encodePacked(
        ["address", "bytes"],
        [smartAccount.activeValidationModule.moduleAddress, signature]
      )

      const contents = keccak256(
        encodePacked(
          ["bytes", "bytes", "bytes"],
          ["0x1901", domainSeparator, hashMessage(data)]
        )
      )

      const contractResponse = await testClient.readContract({
        address: await smartAccount.getAddress(),
        abi: NexusAbi,
        functionName: "isValidSignature",
        args: [contents, finalSignature]
      })

      const viemResponse = await testClient.verifyMessage({
        address: smartAccountAddress,
        message: data,
        signature: finalSignature
      })

      expect(contractResponse).toBe(eip1271MagicValue)
      expect(viemResponse).toBe(true)
    }
  })

  test("should have consistent behaviour between ethers.AbiCoder.defaultAbiCoder() and viem.encodeAbiParameters()", async () => {
    const expectedResult =
      "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000090f79bf6eb2c4f870365e785982e1f101e93b90600000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000090f79bf6eb2c4f870365e785982e1f101e93b906000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000"

    const Executions = ParamType.from({
      type: "tuple(address,uint256,bytes)[]",
      baseType: "tuple",
      name: "executions",
      arrayLength: null,
      components: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "callData", type: "bytes" }
      ]
    })

    const viemExecutions: AbiParameter = {
      type: "tuple[]",
      components: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "callData", type: "bytes" }
      ]
    }

    const txs = [
      {
        target: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        callData: "0x",
        value: 1n
      },
      {
        target: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        callData: "0x",
        value: 1n
      }
    ]

    const executionCalldataPrepWithEthers =
      ethers.AbiCoder.defaultAbiCoder().encode([Executions], [txs])

    const executionCalldataPrepWithViem = encodeAbiParameters(
      [viemExecutions],
      [txs]
    )

    expect(executionCalldataPrepWithEthers).toBe(expectedResult)
    expect(executionCalldataPrepWithViem).toBe(expectedResult)
  })

  // test.skip("should call isValidSignature for deployed smart account", async () => {
  //   const smartAccount = await createSmartAccountClient({
  //     signer: walletClient,
  //     bundlerUrl
  //   })

  //   const message = "hello world"
  //   const signature = await smartAccount.signMessage(message)

  //   const isVerified = await publicClient.readContract({
  //     address: await smartAccount.getAddress(),
  //     abi: NexusAccountAbi,
  //     functionName: "isValidSignature",
  //     args: [hashMessage(message), signature]
  //   })

  //   expect(isVerified).toBe(eip1271MagicValue)
  // })

  // test.skip("should verifySignature of not deployed", async () => {
  //   const undeployedSmartAccount = await createSmartAccountClient({
  //     signer: walletClient,
  //     bundlerUrl,
  //     index: 99n
  //   })
  //   const isDeployed = await undeployedSmartAccount.isAccountDeployed()
  //   if (!isDeployed) {
  //     const message = "hello world"

  //     const signature = await smartAccount.signMessage(message)
  //     // OR
  //     // const signature = await smartAccount.signMessageWith6492(message)

  //     const isVerified = await publicClient.readContract({
  //       address: await smartAccount.getAddress(),
  //       abi: NexusAccountAbi,
  //       functionName: "isValidSignature",
  //       args: [hashMessage(message), signature]
  //     })

  //     expect(isVerified).toBe(eip1271MagicValue)
  //   }
  // })

  // test.skip("should verifySignature using viem", async () => {
  //   const isDeployed = await smartAccount.isAccountDeployed()
  //   if (isDeployed) {
  //     const message = "0x123"

  //     const signature = await smartAccount.signMessage(message)

  //     console.log(signature, 'signature');
  //     console.log(hashMessage(message), 'hashMessage(message)');

  //     // const isVerified = await verifyMessage(publicClient, {
  //     //   address: await smartAccount.getAddress(),
  //     //   message,
  //     //   signature,
  //     // })

  //     const isVerified = await publicClient.readContract({
  //       address: await smartAccount.getAddress(),
  //       abi: NexusAccountAbi,
  //       functionName: "isValidSignature",
  //       args: [hashMessage(message), signature]
  //     })

  //     console.log(isVerified, "isVerified");

  //     expect(isVerified).toBe(eip1271MagicValue)
  //   }
  // })

  // @note Removed untill we implement the Bundler (Pimlico's bundler does no behave as expected in this test)
  // test.skip(
  //   "should simulate a user operation execution, expecting to fail",
  //   async () => {
  //     const smartAccount = await createSmartAccountClient({
  //       signer: walletClient,
  //       bundlerUrl
  //     })

  //     const balances = await smartAccount.getBalances()
  //     expect(balances[0].amount).toBeGreaterThan(0n)

  //     const encodedCall = encodeFunctionData({
  //       abi: parseAbi(["function deposit()"]),
  //       functionName: "deposit"
  //     })

  //     const amoyTestContract = "0x59Dbe91FBa486CA10E4ad589688Fe547a48bd62A"

  //     // fail if value is not bigger than 1
  //     // the contract call requires a deposit of at least 1 wei
  //     const tx1 = {
  //       to: amoyTestContract as Hex,
  //       data: encodedCall,
  //       value: 0
  //     }
  //     const tx2 = {
  //       to: amoyTestContract as Hex,
  //       data: encodedCall,
  //       value: 2
  //     }

  //     await expect(smartAccount.buildUserOp([tx1, tx2])).rejects.toThrow()
  //   }
  // )

  // @note Removed untill we implement the Bundler (Pimlico's bundler does no behave as expected in this test)
  // test.skip(
  //   "should simulate a user operation execution, expecting to pass execution",
  //   async () => {
  //     const smartAccount = await createSmartAccountClient({
  //       signer: walletClient,
  //       bundlerUrl
  //     })

  //     const balances = await smartAccount.getBalances()
  //     expect(balances[0].amount).toBeGreaterThan(0n)

  //     const encodedCall = encodeFunctionData({
  //       abi: parseAbi(["function deposit()"]),
  //       functionName: "deposit"
  //     })

  //     const amoyTestContract = "0x59Dbe91FBa486CA10E4ad589688Fe547a48bd62A"

  //     // fail if value is not bigger than 1
  //     // the contract call requires a deposit of at least 1 wei
  //     const tx1 = {
  //       to: amoyTestContract as Hex,
  //       data: encodedCall,
  //       value: 2
  //     }
  //     const tx2 = {
  //       to: amoyTestContract as Hex,
  //       data: encodedCall,
  //       value: 2
  //     }

  //     await expect(smartAccount.buildUserOp([tx1, tx2])).resolves.toBeTruthy()
  //   }
  // )

  // test.skip("Should verify supported modes", async () => {
  //   expect(
  //     await smartAccount.supportsExecutionMode(ACCOUNT_MODES.DEFAULT_SINGLE)
  //   ).to.be.true
  //   expect(
  //     await smartAccount.supportsExecutionMode(ACCOUNT_MODES.DEFAULT_BATCH)
  //   ).to.be.true
  //   expect(await smartAccount.supportsExecutionMode(ACCOUNT_MODES.TRY_BATCH)).to
  //     .be.true
  //   expect(await smartAccount.supportsExecutionMode(ACCOUNT_MODES.TRY_SINGLE))
  //     .to.be.true

  //   expect(
  //     await smartAccount.supportsExecutionMode(ACCOUNT_MODES.DELEGATE_SINGLE)
  //   ).to.be.false
  // })
})
