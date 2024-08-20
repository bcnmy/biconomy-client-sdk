import {
  http,
  type Account,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type WalletClient,
  createWalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
  createSmartAccountClient
} from "../../src/account"
import { pKey, pKeyTwo, toTestClient, topUp } from "../test.utils"
import type { ChainConfig, MasterClient } from "../test.utils"
import { type TestFileNetworkType, toNetwork } from "../testSetup"

const NETWORK_TYPE: TestFileNetworkType = "GLOBAL"

describe.skip("Bundler", () => {
  let network: ChainConfig

  let chain: Chain
  let chainId: number
  let bundlerUrl: string
  let testClient: MasterClient
  let account: PrivateKeyAccount
  let recipientAccount: Account
  let walletClient: WalletClient
  let recipientWalletClient: WalletClient
  let smartAccount: NexusSmartAccount
  let recipientSmartAccount: NexusSmartAccount
  let smartAccountAddress: Hex
  let recipientSmartAccountAddress: Hex

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)
    chain = network.chain
    chainId = chain.id
    bundlerUrl = network.bundlerUrl

    account = privateKeyToAccount(pKey)
    recipientAccount = privateKeyToAccount(pKeyTwo)

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

    testClient = toTestClient(chain, account)

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain
    })

    recipientSmartAccount = await createSmartAccountClient({
      signer: recipientWalletClient,
      bundlerUrl,
      chain
    })

    smartAccountAddress = await smartAccount.getAccountAddress()
    recipientSmartAccountAddress = await recipientSmartAccount.getAddress()
    await topUp(testClient, smartAccountAddress)
    await topUp(testClient, recipientSmartAccountAddress)
  })

  test("dummyTest", async () => {
    expect(true).toBeTruthy()
  }, 100000)
})
