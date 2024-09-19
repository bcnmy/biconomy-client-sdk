import { http, type Account, type Address, type Chain, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../../test/__contracts/abi"
import { mockAddresses } from "../../../../test/__contracts/mockAddresses"
import { toNetwork } from "../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../test/testUtils"
import { type NexusClient, createNexusClient } from "../../createNexusClient"

describe("account.decorators", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let account: Account
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let recipient: Account
  let recipientAddress: Address

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address
    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      holder: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should sign a message", async () => {
    const signedMessage = await nexusClient.signMessage({ message: "hello" })

    expect(signedMessage).toEqual(
      "0x6854688d3d9a87a33addd5f4deb5cea1b97fa5b7f16ea9a3478698f695fd1401bfe27e9e4a7e8e3da94aa72b021125e31fa899cc573c48ea3fe1d4ab61a9db10c19032026e3ed2dbccba5a178235ac27f94504311c"
    )
  })

  test.concurrent("should currently fail to sign with typed data", async () => {
    expect(
      nexusClient.signTypedData({
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        },
        types: {
          Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
          ],
          Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
          ]
        },
        primaryType: "Mail",
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          contents: "Hello, Bob!"
        }
      })
    ).rejects.toThrow()
  })

  test("should send a user operation using sendTransaction", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should write to a contract", async () => {
    const counterValueBefore = await testClient.readContract({
      abi: CounterAbi,
      functionName: "getNumber",
      address: mockAddresses.Counter
    })

    expect(counterValueBefore).toBe(0n)
    const hash = await nexusClient.writeContract({
      abi: CounterAbi,
      functionName: "incrementNumber",
      address: mockAddresses.Counter,
      chain
    })
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    const counterValueAfter = await testClient.readContract({
      abi: CounterAbi,
      functionName: "getNumber",
      address: mockAddresses.Counter
    })

    expect(status).toBe("success")
    expect(counterValueAfter).toBe(1n)
  })
})
