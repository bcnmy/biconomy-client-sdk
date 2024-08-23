import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
  type NexusSmartAccountConfig,
  createSmartAccountClient
} from "../../src/account"
import {
  fundAndDeploy,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../test.utils"
import type { MasterClient, NetworkConfig } from "../test.utils"
import { type TestFileNetworkType, toNetwork } from "../testSetup"

const NETWORK_TYPE: TestFileNetworkType = "LOCAL"

describe("modules", () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string
  let testClient: MasterClient
  let account: Account
  let recipientAccount: Account
  let walletClient: WalletClient
  let recipientWalletClient: WalletClient
  let smartAccount: NexusSmartAccount
  let recipientSmartAccount: NexusSmartAccount
  let smartAccountAddress: Hex
  let recipientSmartAccountAddress: Hex

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)

    const testConfig: Partial<NexusSmartAccountConfig> = {
      factoryAddress: network.deployment.k1FactoryAddress,
      k1ValidatorAddress: network.deployment.k1ValidatorAddress
    }

    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = getTestAccount(2)
    recipientAccount = getTestAccount(3)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    recipientWalletClient = createWalletClient({
      account: recipientAccount,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, getTestAccount())

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain,
      ...testConfig
    })

    recipientSmartAccount = await createSmartAccountClient({
      signer: recipientWalletClient,
      bundlerUrl,
      chain,
      ...testConfig
    })

    smartAccountAddress = await smartAccount.getAddress()
    recipientSmartAccountAddress = await recipientSmartAccount.getAddress()
    await fundAndDeploy(testClient, [smartAccount, recipientSmartAccount])
  })
  afterAll(async () => {
    await killNetwork([network.rpcPort, network.bundlerPort])
  })

  test("should have account addresses", async () => {
    const addresses = await Promise.all([
      account.address,
      smartAccount.getAddress(),
      recipientAccount.address,
      recipientSmartAccount.getAddress()
    ])
    expect(addresses.every(Boolean)).to.be.true
    expect(addresses).toStrictEqual([
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x2915317448Dd00158361dcBB47eacF26f774DdA8", // Sender smart account
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x89028E0fD7Af7F864878e0209118DF6A9229A9Ce" // Recipient smart account
    ])
  })

  test("should check bytecode at Counter contract", async () => {
    const counterAddress = network.deployment.counterAddress
    const byteCode = await testClient.getBytecode({ address: counterAddress })
    expect(byteCode).toBeTruthy()
  })
})
