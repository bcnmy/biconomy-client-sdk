import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  pad,
  toBytes,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { parseReferenceValue } from "../src"
import {
  type NexusSmartAccount,
  createSmartAccountClient
} from "../src/account"
import policies, {
  ParamCondition,
  type ActionConfig
} from "../src/modules/utils/SmartSessionHelpers"
import { TEST_CONTRACTS } from "./src/callDatas"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "./src/testUtils"
import type { MasterClient, NetworkConfig } from "./src/testUtils"
const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"

describe("smart.sessions", () => {
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
    expect(addresses.every(Boolean)).toBeTruthy()
    expect(addresses).toStrictEqual([
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x9faF274EB7cc2D342d786Ad0995dB3c0d641446d" // Sender smart account
    ])
  })

  test("should have smart account bytecode", async () => {
    const bytecodes = await Promise.all(
      [TEST_CONTRACTS.SmartSession, TEST_CONTRACTS.UniActionPolicy].map(
        (address) => testClient.getBytecode(address)
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
