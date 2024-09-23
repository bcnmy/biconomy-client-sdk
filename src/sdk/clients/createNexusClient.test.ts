import {
  http,
  type Account,
  type Address,
  type Chain,
  encodeFunctionData,
  parseEther,
  encodeAbiParameters,
  encodePacked
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../test/__contracts/abi"
import mockAddresses from "../../test/__contracts/mockAddresses"
import { toNetwork } from "../../test/testSetup"
import {
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import { pKey } from "../../test/testUtils"
import { addresses } from "../__contracts/addresses"
import { ERROR_MESSAGES } from "../account/utils/Constants"
import { makeInstallDataAndHash } from "../account/utils/Utils"
import { getChain } from "../account/utils/getChain"
import { type NexusClient, createNexusClient } from "./createNexusClient"

describe("nexus.client", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let account: Account
  let recipientAccount: Account
  let recipientAddress: Address
  let nexusClient: NexusClient
  let nexusAccountAddress: Address

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    recipientAccount = getTestAccount(1)
    recipientAddress = recipientAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should deploy smart account if not deployed", async () => {
    const isDeployed = await nexusClient.account.isDeployed()

    if (!isDeployed) {
      console.log("Smart account not deployed. Deploying...")

      // Fund the account first
      await topUp(testClient, nexusAccountAddress, parseEther("0.01"))

      const hash = await nexusClient.sendTransaction({
        calls: [
          {
            to: nexusAccountAddress,
            value: 0n,
            data: "0x"
          }
        ]
      })
      const { status } = await testClient.waitForTransactionReceipt({
        hash
      })
      expect(status).toBe("success")

      const isNowDeployed = await nexusClient.account.isDeployed()
      expect(isNowDeployed).toBe(true)

      console.log("Smart account deployed successfully")
    } else {
      console.log("Smart account already deployed")
    }

    // Verify the account is now deployed
    const finalDeploymentStatus = await nexusClient.account.isDeployed()
    expect(finalDeploymentStatus).toBe(true)
  })

  test("should fund the smart account", async () => {
    await topUp(testClient, nexusAccountAddress, parseEther("0.01"))

    const balance = await getBalance(testClient, nexusAccountAddress)
    expect(balance > 0)
  })

  // @note @todo this test is only valid for anvil
  test("should have account addresses", async () => {
    const addresses = await Promise.all([
      account.address,
      nexusClient.account.getAddress()
    ])
    expect(addresses.every(Boolean)).to.be.true
    expect(addresses).toStrictEqual([
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0xCAbC052f31414FfEbeA1094924dFeb0D17d85034" // Sender smart account
    ])
  })

  test("should estimate gas for writing to a contract", async () => {
    const encodedCall = encodeFunctionData({
      abi: CounterAbi,
      functionName: "incrementNumber"
    })
    const call = {
      to: mockAddresses.Counter,
      data: encodedCall
    }
    const results = await Promise.all([
      nexusClient.estimateUserOperationGas({ calls: [call] }),
      nexusClient.estimateUserOperationGas({ calls: [call, call] })
    ])

    const increasingGasExpenditure = results.every(
      ({ preVerificationGas }, i) =>
        preVerificationGas > (results[i - 1]?.preVerificationGas ?? 0)
    )

    expect(increasingGasExpenditure).toBeTruthy()
  }, 60000)

  test("should check enable mode", async () => {
    const result = makeInstallDataAndHash(account.address, [
      {
        type: "validator",
        config: account.address
      }
    ])

    expect(result).toBeTruthy()
  }, 30000)

  // test("should create a nexusAccount from an ethers signer", async () => {
  //   const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
  //   const ethersSigner = new Wallet(pKey, ethersProvider)

  //   const ethOwnerNexusClient = await createNexusClient({
  //     chain,
  //     bundlerTransport: http(bundlerUrl),
  //     signer: ethersSigner,
  //     transport: http(chain.rpcUrls.default.http[0])
  //   })

  //   expect(await ethOwnerNexusClient.account.getAddress()).toBeTruthy()
  // })

  test("should read estimated user op gas values", async () => {
    const userOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: recipientAccount.address,
          data: "0x"
        }
      ]
    })

    const estimatedGas = await nexusClient.estimateUserOperationGas(userOp)
    expect(estimatedGas.verificationGasLimit).toBeTruthy()
    expect(estimatedGas.callGasLimit).toBeTruthy()
    expect(estimatedGas.preVerificationGas).toBeTruthy()
  }, 30000)

  test.skip("should create a smart account with paymaster with an api key", async () => {
    const paymaster = nexusClient.paymaster
    expect(paymaster).not.toBeNull()
    expect(paymaster).not.toBeUndefined()
  })

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

  test("should have attached erc757 actions", async () => {
    const [
      accountId,
      isModuleInstalled,
      supportsExecutionMode,
      supportsModule
    ] = await Promise.all([
      nexusClient.accountId(),
      nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          address: addresses.K1Validator,
          data: "0x"
        }
      }),
      nexusClient.supportsExecutionMode({
        type: "delegatecall"
      }),
      nexusClient.supportsModule({
        type: "validator"
      })
    ])
    expect(accountId).toBe("biconomy.nexus.1.0.0-beta")
    expect(isModuleInstalled).toBe(true)
    expect(supportsExecutionMode).toBe(true)
    expect(supportsModule).toBe(true)
  })

  test("should send eth twice", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const tx = { to: recipientAddress, value: 1n }
    const hash = await nexusClient.sendTransaction({ calls: [tx, tx] })
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(2n)
  })
})
