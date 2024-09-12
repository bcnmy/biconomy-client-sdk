import { http, type Account, type Address, type Chain, isHex } from "viem"
import type { BundlerClient } from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../tests/testSetup"
import {
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../tests/testUtils"
import type { MasterClient, NetworkConfig } from "../../tests/testUtils"
import contracts from "../__contracts"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import { toBicoBundlerClient } from "./toBicoBundlerClient"

describe("bico.bundler", () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let account: Account
  let nexusAccountAddress: Address
  let bicoBundler: BundlerClient
  let nexusAccount: NexusAccount

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    testClient = toTestClient(chain, getTestAccount(0))

    nexusAccount = await toNexusAccount({
      owner: account,
      chain,
      transport: http()
    })

    bicoBundler = toBicoBundlerClient({ bundlerUrl, account: nexusAccount })
    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()
    await topUp(testClient, nexusAccountAddress)
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should have 4337 bundler actions", async () => {
    const [chainId, supportedEntrypoints, preparedUserOp] = await Promise.all([
      bicoBundler.getChainId(),
      bicoBundler.getSupportedEntryPoints(),
      bicoBundler.prepareUserOperation({
        sender: account.address,
        nonce: 0n,
        data: "0x",
        signature: "0x",
        verificationGasLimit: 1n,
        preVerificationGas: 1n,
        callData: "0x",
        callGasLimit: 1n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
        account: nexusAccount
      })
    ])
    expect(chainId).toEqual(chain.id)
    expect(supportedEntrypoints).to.include(contracts.entryPoint.address)
    expect(preparedUserOp).toHaveProperty("signature")
  })

  test("should send a user operation and get the receipt", async () => {
    const calls = [{ to: account.address, value: 1n }]
    // Must find gas fees before sending the user operation
    const gas = await testClient.estimateFeesPerGas()
    const hash = await bicoBundler.sendUserOperation({
      ...gas,
      calls,
      account: nexusAccount
    })
    const receipt = await bicoBundler.waitForUserOperationReceipt({ hash })
    expect(receipt.success).toBeTruthy()
  })
})
