import { http, type Account, type Address, type Chain, pad, toHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { parseReferenceValue } from ".."
import { TEST_CONTRACTS } from "../../test/callDatas"
import { toNetwork } from "../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import {
  type NexusClient,
  createNexusClient
} from "../clients/createNexusClient"
import policies, { ParamCondition } from "./smartSessions"

describe("smart.sessions", async () => {
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
      owner: account,
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

  test("should have smart account bytecode", async () => {
    const bytecodes = await Promise.all(
      [TEST_CONTRACTS.SmartSession, TEST_CONTRACTS.UniActionPolicy].map(
        (address) => testClient.getCode(address)
      )
    )
    expect(bytecodes.every((bytecode) => !!bytecode?.length)).toBeTruthy()
  })

  test("should parse a human friendly policy reference value to the hex version expected by the contracts", async () => {
    const TWO_THOUSAND_AS_HEX =
      "0x00000000000000000000000000000000000000000000000000000000000007d0"

    expect(parseReferenceValue(BigInt(2000))).toBe(TWO_THOUSAND_AS_HEX)
    expect(parseReferenceValue(2000)).toBe(TWO_THOUSAND_AS_HEX)
    expect(parseReferenceValue("7d0")).toBe(TWO_THOUSAND_AS_HEX)
    expect(
      parseReferenceValue(
        parseReferenceValue(pad(toHex(BigInt(2000)), { size: 32 }))
      )
    ).toBe(TWO_THOUSAND_AS_HEX)
  })

  test("should get a universal action policy", async () => {
    const actionConfigData = {
      valueLimitPerUse: BigInt(1000),
      paramRules: {
        length: 2,
        rules: [
          {
            condition: ParamCondition.EQUAL,
            offsetIndex: 0,
            isLimited: true,
            ref: 1000,
            usage: {
              limit: BigInt(1000),
              used: BigInt(10)
            }
          },
          {
            condition: ParamCondition.LESS_THAN,
            offsetIndex: 1,
            isLimited: false,
            ref: 2000,
            usage: {
              limit: BigInt(2000),
              used: BigInt(100)
            }
          }
        ]
      }
    }
    const installUniversalPolicy = policies.to.universalAction(actionConfigData)

    expect(installUniversalPolicy.address).toEqual(
      TEST_CONTRACTS.UniActionPolicy.address
    )
    expect(installUniversalPolicy.initData).toBeDefined()
    expect(installUniversalPolicy.deInitData).toEqual("0x")
  })

  test("should get a sudo action policy", async () => {
    const installSudoActionPolicy = policies.sudo
    expect(installSudoActionPolicy.address).toBeDefined()
    expect(installSudoActionPolicy.initData).toEqual("0x")
    expect(installSudoActionPolicy.deInitData).toEqual("0x")
  })

  test("should get a spending limit policy", async () => {
    const installSpendingLimitPolicy = policies.to.spendingLimits([
      {
        limit: BigInt(1000),
        token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      }
    ])

    expect(installSpendingLimitPolicy.address).toBeDefined()
    expect(installSpendingLimitPolicy.initData).toBeDefined()
    expect(installSpendingLimitPolicy.deInitData).toEqual("0x")
  })
})
