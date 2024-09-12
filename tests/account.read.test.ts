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
  toHex,
  parseAbi,
  PublicClient,
  concatHex,
  parseEther,
  domainSeparator,
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
  createSmartAccountClient,
  eip1271MagicValue,
  getChain,
  makeInstallDataAndHash
} from "../src/account"
import { CounterAbi, MockPermitTokenAbi } from "./src/__contracts/abi"
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
} from "./src/testUtils"

const NETWORK_TYPE: TestFileNetworkType = "PUBLIC_TESTNET"

describe("account.read", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient
  let publicClient: PublicClient

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

    publicClient = createPublicClient({
      chain,
      transport: http()
    })

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

  test("should deploy smart account if not deployed", async () => {
    const isDeployed = await smartAccount.isAccountDeployed()

    if (!isDeployed) {
      console.log("Smart account not deployed. Deploying...")

      // Fund the account first
      await topUp(testClient, smartAccountAddress, parseEther("0.01"))

      // Create a dummy transaction to trigger deployment
      const dummyTx = {
        to: smartAccountAddress,
        value: 0n,
        data: "0x"
      }

      const userOp = await smartAccount.sendTransaction([dummyTx])
      await userOp.wait()

      const isNowDeployed = await smartAccount.isAccountDeployed()
      expect(isNowDeployed).toBe(true)

      console.log("Smart account deployed successfully")
    } else {
      console.log("Smart account already deployed")
    }

    // Verify the account is now deployed
    const finalDeploymentStatus = await smartAccount.isAccountDeployed()
    expect(finalDeploymentStatus).toBe(true)
  })

  test("should fund the smart account", async () => {
    await topUp(testClient, smartAccountAddress, parseEther("0.01"))
    const [balance] = await smartAccount.getBalances()
    expect(balance.amount > 0)
  })

  // @note @todo this test is only valid for anvil 
  test.skip("should have account addresses", async () => {
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

  test("should estimate gas for minting an NFT", async () => {
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

  test("should throw if PrivateKeyAccount is used as signer and rpcUrl is not provided", async () => {
    const createSmartAccount = createSmartAccountClient({
      chain,
      signer: account as SupportedSigner,
      bundlerUrl
    })

    await expect(createSmartAccount).rejects.toThrow(
      ERROR_MESSAGES.MISSING_RPC_URL
    )
  }, 50000)

  test("should get all modules", async () => {
    const modules = smartAccount.getInstalledModules()
    if (await smartAccount.isAccountDeployed()) {
      expect(modules).resolves
    } else {
      expect(modules).rejects.toThrow("Account is not deployed")
    }
  }, 30000)

  test("should check if module is enabled on the smart account", async () => {
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

  test("enable mode", async () => {
    const result = makeInstallDataAndHash(account.address, [
      {
        moduleType: "validator",
        config: account.address
      }
    ])
    expect(result).toBeTruthy()
  }, 30000)

  test("should create a smartAccountClient from an ethers signer", async () => {
    const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
    const ethersSigner = new Wallet(pKey, ethersProvider)

    const smartAccount = await createSmartAccountClient({
      chain,
      signer: ethersSigner,
      bundlerUrl,
      rpcUrl: chain.rpcUrls.default.http[0]
    })

    expect(smartAccount).toBeTruthy();
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

  test("should read estimated user op gas values", async () => {
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

  test("should have an active validation module", async () => {
    const module = smartAccount.activeValidationModule
    expect(module).toBeTruthy()
  })

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

  test("should fail to create a smartAccountClient from a walletClient without an account", async () => {
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

  test.skip(
    "should create a smart account with paymaster with an api key",
    async () => {
      const paymaster = smartAccount.paymaster
      expect(paymaster).not.toBeNull()
      expect(paymaster).not.toBeUndefined()
    }
  )

  test("should return chain object for chain id 1", async () => {
    const chainId = 1
    const chain = getChain(chainId)
    expect(chain.id).toBe(chainId)
  })

  test("should have correct fields", async () => {
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

  test("should throw an error, chain id not found", async () => {
    const chainId = 0
    expect(() => getChain(chainId)).toThrow(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  })

  test("should have matching counterFactual address from the contracts with smartAccount.getAddress()", async () => {
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

  test("should be deployed to counterfactual address", async () => {
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

  test("should check if K1Validator is enabled", async () => {
    const ecdsaOwnershipModule = addresses.K1Validator

    expect(ecdsaOwnershipModule).toBe(
      smartAccount.activeValidationModule.getAddress()
    )
  })

  test("should fail to deploy a smart account if no native token balance or paymaster", async () => {
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

  test("should fail to deploy a smart account if already deployed", async () => {
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

  test("should error if no recipient exists", async () => {
    const token: Hex = "0x69835C1f31ed0721A05d5711C1d669C10802a3E1"

    const txs = [
      { address: token, amount: BigInt(1), recipient: account.address },
      { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
    ]

    expect(async () => smartAccount.withdraw(txs)).rejects.toThrow(
      ERROR_MESSAGES.NO_RECIPIENT
    )
  })

  test("should error when withdraw all of native token is attempted without an amount explicitly set", async () => {
    expect(async () =>
      smartAccount.withdraw(null, account.address)
    ).rejects.toThrow(ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT)
  }, 6000)

  test("should check native token balance and more token info for smartAccount", async () => {
    const [ethBalanceFromSmartAccount] = await smartAccount.getBalances()

    expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n)
    expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS)
    expect(ethBalanceFromSmartAccount.chainId).toBe(chain.id)
    expect(ethBalanceFromSmartAccount.decimals).toBe(18)
  }, 60000)

  test.skip(
    "should check balance of supported token",
    async () => {
      const tokens = await smartAccount.getSupportedTokens()
      const [firstToken] = tokens

      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens[0]).toHaveProperty("balance")
      expect(firstToken.balance.amount).toBeGreaterThanOrEqual(0n)
    },
    60000
  )

  // @note Nexus SA signature needs to contain the validator module address in the first 20 bytes
  test("should test isValidSignature PersonalSign to be valid", async () => {
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

  test.concurrent(
    "should test isValidSignature EIP712Sign to be valid with viem",
    async () => {
      if (await smartAccount.isAccountDeployed()) {
        const PARENT_TYPEHASH = "TypedDataSign(Contents contents,bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions)Contents(bytes32 stuff)";

        const message = {
          contents: keccak256(toBytes("test", { size: 32 }))
        }

        const domainSeparator = (await publicClient.readContract({
          address: await smartAccount.getAddress(),
          abi: parseAbi([
            "function DOMAIN_SEPARATOR() external view returns (bytes32)"
          ]),
          functionName: "DOMAIN_SEPARATOR"
        }))

        const typedHashHashed = keccak256(
          concat([
            '0x1901',
            domainSeparator,
            message.contents
          ])
        );

        const accountDomainStructFields = await getAccountDomainStructFields(testClient, await smartAccount.getAddress());

        const parentStructHash = keccak256(
          encodePacked(["bytes", "bytes"], [
            encodeAbiParameters(
              parseAbiParameters(["bytes32, bytes32"]),
              [keccak256(toBytes(PARENT_TYPEHASH)), message.contents]
            ),
            accountDomainStructFields
          ])
        );

        const dataToSign = keccak256(
          concat([
            '0x1901',
            domainSeparator,
            parentStructHash
          ])
        );

        const signature = await walletClient.signMessage({ message: { raw: toBytes(dataToSign) }, account });

        const contentsType = toBytes("Contents(bytes32 stuff)");

        const signatureData = concatHex([
          signature,
          domainSeparator,
          message.contents,
          toHex(contentsType),
          toHex(contentsType.length, { size: 2 })
        ]);

        const finalSignature = encodePacked(["address", "bytes"], [
          addresses.K1Validator,
          signatureData
        ]);

        const contractResponse = await publicClient.readContract({
          address: await smartAccount.getAddress(),
          abi: NexusAbi,
          functionName: "isValidSignature",
          args: [typedHashHashed, finalSignature]
        })

        expect(contractResponse).toBe(eip1271MagicValue)
      } else {
        throw new Error("Smart account is not deployed")
      }
    }
  )

  test("should sign using signTypedData SDK method", async () => {
    const permitTestTokenAddress = "0xd8a978B9a0e1Af5579314E626D77fc1C9fF76c7D" as Hex;
    const appDomain = {
      chainId: network.chain.id,
      name: "TestToken",
      verifyingContract: permitTestTokenAddress,
      version: "1"
    }

    const primaryType = "Contents"
    const types = {
      Contents: [
        {
          name: "stuff",
          type: "bytes32"
        }
      ]
    }

    const permitTypehash = keccak256(toBytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"));
    const nonce = await publicClient.readContract({
      address: permitTestTokenAddress,
      abi: MockPermitTokenAbi,
      functionName: "nonces",
      args: [smartAccountAddress]
    }) as bigint;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

    const message = {
      stuff: keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, address, address, uint256, uint256, uint256"),
          [permitTypehash, smartAccountAddress, smartAccountAddress, parseEther("2"), nonce, deadline]
        )
      )
    };

    const appDomainSeparator = domainSeparator(
      {
        domain: appDomain
      }
    )

    const contentsHash = keccak256(
      concat([
        '0x1901',
        appDomainSeparator,
        message.stuff
      ])
    );

    const finalSignature = await smartAccount.signTypedData({
      domain: appDomain,
      primaryType,
      types,
      message
    })

    const nexusResponse = await publicClient.readContract({
      address: await smartAccount.getAddress(),
      abi: NexusAbi,
      functionName: "isValidSignature",
      args: [contentsHash, finalSignature]
    })

    const permitTokenResponse = await walletClient.writeContract({
      account: account,
      address: permitTestTokenAddress,
      abi: MockPermitTokenAbi,
      functionName: "permitWith1271",
      chain: network.chain,
      args: [await smartAccount.getAddress(), await smartAccount.getAddress(), parseEther("2"), deadline, finalSignature]
    })

    await publicClient.waitForTransactionReceipt({ hash: permitTokenResponse });

    const allowance = await publicClient.readContract({
      address: permitTestTokenAddress,
      abi: MockPermitTokenAbi,
      functionName: "allowance",
      args: [await smartAccount.getAddress(), await smartAccount.getAddress()]
    })

    expect(allowance).toEqual(parseEther("2"));
    expect(nexusResponse).toEqual("0x1626ba7e")
  })
})
