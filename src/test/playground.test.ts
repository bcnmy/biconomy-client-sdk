import {
  http,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { createBicoPaymasterClient } from "../sdk/clients/createBicoPaymasterClient"
import {
  type NexusClient,
  createNexusClient
} from "../sdk/clients/createNexusClient"
import { playgroundTrue, toNetwork } from "./testSetup"
import type { NetworkConfig } from "./testUtils"

// Remove the following lines to use the default factory and validator addresses
// These are relevant only for now on base sopelia chain and are likely to change
const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

describe.skipIf(!playgroundTrue)("playground", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let account: PrivateKeyAccount
  let recipientAddress: Address
  let nexusClient: NexusClient
  let nexusAccountAddress: Address

  beforeAll(async () => {
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl
    account = network.account as PrivateKeyAccount

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    publicClient = createPublicClient({
      chain,
      transport: http()
    })
  })

  test("should have factory and k1Validator deployed", async () => {
    const byteCodes = await Promise.all([
      publicClient.getCode({
        address: k1ValidatorAddress
      }),
      publicClient.getCode({
        address: factoryAddress
      })
    ])

    expect(byteCodes.every(Boolean)).toBeTruthy()
  })

  test("should init the smart account", async () => {
    nexusClient = await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress,
      factoryAddress
    })
  })

  test("should log relevant addresses", async () => {
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    console.log({ nexusAccountAddress })
  })

  test("should check balances and top up relevant addresses", async () => {
    const [ownerBalance, smartAccountBalance] = await Promise.all([
      publicClient.getBalance({
        address: account.address
      }),
      publicClient.getBalance({
        address: nexusAccountAddress
      })
    ])

    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )
    if (smartAccountBalance === 0n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account,
        to: nexusAccountAddress,
        value: 1000000000000000000n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log({ receipt })
    }
    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should send some native token", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: recipientAddress
    })
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })
    const { status } = await publicClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await publicClient.getBalance({
      address: recipientAddress
    })
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should send a userOp using pm_sponsorUserOperation", async () => {
    if (!paymasterUrl) {
      console.log("No paymaster url provided")
      return
    }

    nexusClient = await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress,
      factoryAddress,
      paymaster: createBicoPaymasterClient({
        paymasterUrl
      })
    })
    expect(async () =>
      nexusClient.sendTransaction({
        calls: [
          {
            to: account.address,
            value: 1n
          }
        ]
      })
    ).rejects.toThrow("Error in generating paymasterAndData")
  })
})
