import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  Address
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
} from "../src/account"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  getTestAccount,
  getTestSmartAccount,
  killNetwork,
  toTestClient,
} from "./src/testUtils"
import type { MasterClient, NetworkConfig } from "./src/testUtils"
import { createOwnableExecutorModule } from "../src"
import { OwnableExecutorModule } from "../src/modules/executors/OwnableExecutor"
import { TEST_CONTRACTS } from "./src/callDatas"

const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"

describe("modules.ownable.executor.read", () => {
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

  let ownableExecutorModule: OwnableExecutorModule

  const OWNABLE_EXECUTOR_MODULE_ADDRESS = TEST_CONTRACTS.OwnableExecutor.address;

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)

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

    smartAccount = await getTestSmartAccount(account, chain, bundlerUrl)

    smartAccountAddress = await smartAccount.getAddress()

    ownableExecutorModule = await createOwnableExecutorModule(
      smartAccount,
      OWNABLE_EXECUTOR_MODULE_ADDRESS,
      account.address
    )
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("getOwners", async () => {
    const isInitialized = await ownableExecutorModule.isModuleInitialized();
    if (!isInitialized) {
      console.log("Module is not initialized, cannot get owners");
      return;
    }
    const owners: Address[] = await ownableExecutorModule.getOwners()
    expect(owners.length).toBeGreaterThan(0)
  })
})
