import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import {
  http,
  Address,
  type Hex,
  concat,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
  hashMessage,
  keccak256,
  parseAbi,
  parseAbiParameters,
  toBytes
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { bsc, sepolia } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import {
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  ERROR_MESSAGES,
  K1_VALIDATOR,
  ModuleType,
  NATIVE_TOKEN_ALIAS,
  type NexusSmartAccountConfig,
  UserOperationStruct,
  compareChainIds,
  createSmartAccountClient,
  makeInstallDataAndHash
} from "../../src/account"
import { getChain } from "../../src/account"
import type { NexusSmartAccount } from "../../src/account/NexusSmartAccount"
import { BiconomyFactoryAbi } from "../../src/account/abi/K1ValidatorFactory"
import { NexusAccountAbi } from "../../src/account/abi/SmartAccount"
import { createK1ValidatorModule } from "../../src/modules"
import { checkBalance, getBundlerUrl, getConfig } from "../utils"

describe("Account:Read", () => {
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
  let [smartAccount, smartAccountTwo]: NexusSmartAccount[] = []
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

    if (!(await smartAccount.isAccountDeployed())) {
      // await walletClient.sendTransaction({
      //   to: smartAccountAddress,
      //   value: parseEther("0.01")
      // })
      await smartAccount.deploy()
    }

    if (!(await smartAccountTwo.isAccountDeployed())) {
      // await walletClientTwo.sendTransaction({
      //   to: smartAccountAddressTwo,
      //   value: parseEther("0.01")
      // })
      await smartAccountTwo.deploy()
    }
  })

  test.concurrent(
    "should estimate gas for minting an NFT",
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
      const results = await Promise.all([
        smartAccount.getGasEstimate([transaction]),
        smartAccount.getGasEstimate([transaction, transaction])
        // smartAccount.getGasEstimate([transaction], {
        //   paymasterServiceData: {
        //     mode: PaymasterMode.SPONSORED
        //   }
        // }),
        // smartAccount.getGasEstimate([transaction, transaction], {
        //   paymasterServiceData: {
        //     mode: PaymasterMode.SPONSORED
        //   }
        // }),
        // smartAccount.getGasEstimate([transaction], {
        //   paymasterServiceData: {
        //     mode: PaymasterMode.ERC20,
        //     preferredToken: token
        //   }
        // }),
        // await smartAccount.getGasEstimate([transaction, transaction], {
        //   paymasterServiceData: {
        //     mode: PaymasterMode.ERC20,
        //     preferredToken: token
        //   }
        // })
      ])

      const increasingGasExpenditure = results.every(
        (result, i) => result > (results[i - 1] ?? 0)
      )

      expect(increasingGasExpenditure).toBeTruthy()
    },
    60000
  )

  test.concurrent(
    "should throw if PrivateKeyAccount is used as signer and rpcUrl is not provided",
    async () => {
      const account = privateKeyToAccount(`0x${privateKey}`)

      const createSmartAccount = createSmartAccountClient({
        signer: account,
        bundlerUrl
      })

      await expect(createSmartAccount).rejects.toThrow(
        ERROR_MESSAGES.MISSING_RPC_URL
      )
    },
    50000
  )

  test.concurrent(
    "should get all modules",
    async () => {
      const modules = smartAccount.getInstalledModules()
      if (await smartAccount.isAccountDeployed()) {
        expect(modules).resolves
      } else {
        expect(modules).rejects.toThrow("Account is not deployed")
      }
    },
    30000
  )

  test.concurrent(
    "should check if module is enabled on the smart account",
    async () => {
      const isEnabled = smartAccount.isModuleInstalled({
        moduleType: ModuleType.Validation,
        moduleAddress: K1_VALIDATOR
      })
      if (await smartAccount.isAccountDeployed()) {
        expect(isEnabled).resolves.toBeTruthy()
      } else {
        expect(isEnabled).rejects.toThrow("Account is not deployed")
      }
    },
    30000
  )

  test.concurrent(
    "enable mode",
    async () => {
      const result = makeInstallDataAndHash(walletClient.account.address, [
        {
          moduleType: ModuleType.Validation,
          config: walletClient.account.address
        }
      ])
      console.log(result, "result")
      expect(result).toBeTruthy()
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
    "should read estimated user op gas values",
    async () => {
      const tx = {
        to: recipient,
        data: "0x"
      }

      const userOp = await smartAccount.buildUserOp([tx])

      const estimatedGas = await smartAccount.estimateUserOpGas(userOp)
      console.log(estimatedGas, "estimatedGas")
      expect(estimatedGas.maxFeePerGas).toBeTruthy()
      expect(estimatedGas.maxPriorityFeePerGas).toBeTruthy()
      expect(estimatedGas.verificationGasLimit).toBeTruthy()
      expect(estimatedGas.callGasLimit).toBeTruthy()
      expect(estimatedGas.preVerificationGas).toBeTruthy()
    },
    30000
  )

  test.concurrent("should have an active validation module", async () => {
    const module = smartAccount.activeValidationModule
    expect(module).toBeTruthy()
  })

  // @note Ignored untill we implement Paymaster
  // test.concurrent(
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
    /*
     * addresses: [
     * '0xFA66E705cf2582cF56528386Bb9dFCA119767262', // sender
     * '0xe6dBb5C8696d2E0f90B875cbb6ef26E3bBa575AC', // smartAccountSender
     * '0x3079B249DFDE4692D7844aA261f8cf7D927A0DA5', // recipient
     * '0x5F141ee1390D4c9d033a00CB940E509A4811a5E0' // smartAccountRecipient
     * ]
     */
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

  test.concurrent("should not throw and error, chain ids match", async () => {
    const mockBundlerUrl =
      "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
    const mockPaymasterUrl =
      "https://paymaster.biconomy.io/api/v1/11155111/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

    const config: NexusSmartAccountConfig = {
      signer: walletClient,
      bundlerUrl: mockBundlerUrl,
      paymasterUrl: mockPaymasterUrl
    }

    await expect(
      compareChainIds(walletClient, config, false)
    ).resolves.not.toThrow()
  })

  test.concurrent(
    "should throw and error, bundlerUrl chain id and paymaster url chain id does not match with validation module",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

      const k1ValidationModule = await createK1ValidatorModule(
        smartAccount.getSigner()
      )

      const config: NexusSmartAccountConfig = {
        defaultValidationModule: k1ValidationModule,
        activeValidationModule: k1ValidationModule,
        bundlerUrl,
        paymasterUrl: mockPaymasterUrl
      }

      await expect(
        compareChainIds(walletClient, config, false)
      ).rejects.toThrow()
    }
  )

  test.concurrent(
    "should throw and error, signer has chain id (56) and paymasterUrl has chain id (11155111)",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/11155111/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

      const walletClientBsc = createWalletClient({
        account: walletClient.account,
        chain: bsc,
        transport: http(bsc.rpcUrls.default.http[0])
      })

      const config: NexusSmartAccountConfig = {
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

  test.concurrent("should throw an error, chain id not found", async () => {
    const chainId = 0
    expect(() => getChain(chainId)).toThrow(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  })

  test.concurrent(
    "should have matching counterFactual address from the contracts with smartAccount.getAddress()",
    async () => {
      const client = createWalletClient({
        account,
        chain,
        transport: http()
      })

      const smartAccount = await createSmartAccountClient({
        signer: client,
        bundlerUrl,
        paymasterUrl
      })

      const smartAccountAddressFromSDK = await smartAccount.getAccountAddress()

      const publicClient = createPublicClient({
        chain,
        transport: http()
      })

      const factoryContract = getContract({
        address: DEFAULT_BICONOMY_FACTORY_ADDRESS,
        abi: BiconomyFactoryAbi,
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
    }
  )

  test.concurrent(
    "should be deployed to counterfactual address",
    async () => {
      const accountAddress = await smartAccount.getAccountAddress()
      const byteCode = await publicClient.getBytecode({
        address: accountAddress as Hex
      })
      if (await smartAccount.isAccountDeployed()) {
        expect(byteCode?.length).toBeGreaterThan(2)
      } else {
        expect(byteCode?.length).toBe(undefined)
      }
    },
    10000
  )

  test.concurrent(
    "should check if ecdsaOwnershipModule is enabled",
    async () => {
      const ecdsaOwnershipModule = K1_VALIDATOR

      expect(ecdsaOwnershipModule).toBe(
        smartAccount.activeValidationModule.getAddress()
      )
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
    "should fail to deploy a smart account if already deployed",
    async () => {
      if (await smartAccount.isAccountDeployed()) {
        expect(async () => smartAccount.deploy()).rejects.toThrow(
          ERROR_MESSAGES.ACCOUNT_ALREADY_DEPLOYED
        )
      } else {
        expect(smartAccount.deploy()).resolves
      }
    },
    60000
  )

  test.concurrent("should fetch balances for smartAccount", async () => {
    const token = "0x69835C1f31ed0721A05d5711C1d669C10802a3E1"
    const tokenBalanceBefore = await checkBalance(smartAccountAddress, token)
    const [tokenBalanceFromSmartAccount] = await smartAccount.getBalances([
      token
    ])

    expect(tokenBalanceBefore).toBe(tokenBalanceFromSmartAccount.amount)
  })

  test.concurrent("should error if no recipient exists", async () => {
    const token: Hex = "0x69835C1f31ed0721A05d5711C1d669C10802a3E1"

    const txs = [
      { address: token, amount: BigInt(1), recipient: sender },
      { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
    ]

    expect(async () => smartAccount.withdraw(txs)).rejects.toThrow(
      ERROR_MESSAGES.NO_RECIPIENT
    )
  })

  test.concurrent(
    "should error when withdraw all of native token is attempted without an amount explicitly set",
    async () => {
      expect(async () => smartAccount.withdraw(null, sender)).rejects.toThrow(
        ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT
      )
    },
    6000
  )

  test.concurrent(
    "should check native token balance and more token info for smartAccount",
    async () => {
      const [ethBalanceFromSmartAccount] = await smartAccount.getBalances()

      expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n)
      expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS)
      expect(ethBalanceFromSmartAccount.chainId).toBe(chainId)
      expect(ethBalanceFromSmartAccount.decimals).toBe(18)
    },
    60000
  )

  // @note Skip until we implement the Paymaster
  // test.concurrent(
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
  test.concurrent(
    "should verify a correct 712 signature through isValidSignature",
    async () => {
      if (await smartAccount.isAccountDeployed()) {
        const eip1271MagicValue = "0x1626ba7e"
        const data = keccak256("0x1234")

        // Define constants as per the original Solidity function
        const DOMAIN_NAME = "Nexus"
        const DOMAIN_VERSION = "1.0.0-beta"
        const DOMAIN_TYPEHASH =
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        const PARENT_TYPEHASH = "PersonalSign(bytes prefixed)"
        const ALICE_ACCOUNT = smartAccountAddress
        const chainId = sepolia.id

        // Calculate the domain separator
        const domainSeparator = keccak256(
          encodeAbiParameters(
            parseAbiParameters("bytes32, bytes32, bytes32, uint256, address"),
            [
              keccak256(toBytes(DOMAIN_TYPEHASH)),
              keccak256(toBytes(DOMAIN_NAME)),
              keccak256(toBytes(DOMAIN_VERSION)),
              BigInt(chainId),
              ALICE_ACCOUNT
            ]
          )
        )

        // Calculate the parent struct hash
        const parentStructHash = keccak256(
          encodeAbiParameters(parseAbiParameters("bytes32, bytes32"), [
            keccak256(toBytes(PARENT_TYPEHASH)),
            data
          ])
        )

        // Calculate the final hash
        const resultHash: Hex = keccak256(
          concat(["0x1901", domainSeparator, parentStructHash])
        )

        const signature = await smartAccount.signMessage(resultHash)

        const response = await publicClient.readContract({
          address: await smartAccount.getAddress(),
          abi: NexusAccountAbi,
          functionName: "isValidSignature",
          args: [data, signature]
        })

        expect(response).toBe(eip1271MagicValue)
      }
    }
  )

  test.concurrent("should verifySignature of deployed", async () => {
    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl
    })

    const message = "hello world"
    const signature = await smartAccount.signMessage(message)

    const isVerified = await publicClient.readContract({
      address: await smartAccount.getAddress(),
      abi: NexusAccountAbi,
      functionName: "isValidSignature",
      args: [hashMessage(message), signature]
    })

    expect(isVerified).toBeTruthy()
  })

  test.concurrent("should verifySignature of not deployed", async () => {
    const undeployedSmartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      index: 99n
    })
    const isDeployed = await undeployedSmartAccount.isAccountDeployed()
    if (!isDeployed) {
      const message = "hello world"

      const signature = await smartAccount.signMessage(message)

      const isVerified = await publicClient.readContract({
        address: await smartAccount.getAddress(),
        abi: NexusAccountAbi,
        functionName: "isValidSignature",
        args: [hashMessage(message), signature]
      })

      expect(isVerified).toBeTruthy()
    }
  })

  // @note Removed untill we implement the Bundler (Pimlico's bundler does no behave as expected in this test)
  // test.concurrent(
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
  // test.concurrent(
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

  // test.concurrent("Should verify supported modes", async () => {
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
