import { http, type Account, type Address, type Chain, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../tests/testSetup"
import {
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../tests/testUtils"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeploy
} from "../../tests/testUtils"
import { addresses } from "../__contracts/addresses"
import { type NexusClient, toNexusClient } from "./toNexusClient"

describe("nexus.client", () => {
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

    testClient = toTestClient(chain, getTestAccount(0))

    nexusClient = await toNexusClient({
      owner: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeploy(testClient, [nexusClient])
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
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
          context: "0x"
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
    const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(success).toBe(true)
    expect(balanceAfter - balanceBefore).toBe(2n)
  })

  test.skip("should uninstall modules", async () => {
    const result = await nexusClient.uninstallModules({
      modules: [
        {
          type: "validator",
          address: addresses.K1Validator,
          context: "0x"
        }
      ]
    })
  })
})
