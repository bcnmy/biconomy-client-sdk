import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  toBytes,
  toHex,
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { convertSigner, CreateSessionDataParams, createSmartSessionModule, parseReferenceValue, Transaction } from "../src"
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
import addresses from "../src/__contracts/addresses"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
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
      [TEST_CONTRACTS.SmartSession, TEST_CONTRACTS.UniActionPolicy, TEST_CONTRACTS.SimpleSigner].map(
        (address) => testClient.getBytecode(address)
      )
    )
    expect(bytecodes.every((bytecode) => !!bytecode?.length)).toBeTruthy()
  })

  test("should get a universal action policy", async () => {
    const actionConfigData = {
      valueLimitPerUse: BigInt(1000),
      paramRules: {
        length: 2,
        rules: [
          {
            condition: ParamCondition.EQUAL,
            offsetIndex: BigInt(0),
            isLimited: true,
            ref: 1000,
            usage: {
              limit: BigInt(1000),
              used: BigInt(10)
            }
          },
          {
            condition: ParamCondition.LESS_THAN,
            offsetIndex: BigInt(1),
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


  // Todo: move to read tests
  test("should correctly encode the session signature in use mode", async () => {
  }, 60000)

  test("should install smart session validator", async () => {
    const isInstalledBefore = await smartAccount.isModuleInstalled({
      type: "validator",
      moduleAddress: TEST_CONTRACTS.SmartSession.address
    })

    if (!isInstalledBefore) {
      const { wait } = await smartAccount.installModule({
        moduleAddress: TEST_CONTRACTS.SmartSession.address,
        type: "validator"
      })

      const { success: installSuccess } = await wait()
      expect(installSuccess).toBe(true)
    }
  }, 60000)

  test("should create ERC20 transfer session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await smartAccount.isModuleInstalled({
      type: "validator",
      moduleAddress: TEST_CONTRACTS.SmartSession.address
    })

    expect(isInstalledBefore).toBe(true)

    const smartAccountSigner = await convertSigner(walletClient)

    const smartSessionModule = await createSmartSessionModule(
      smartAccountSigner.signer,
      TEST_CONTRACTS.SmartSession.address
    )
     
    // Generate empty bytes32 hex string for dummy permisisonId
    const emptyBytes32 = "0x" + "0".repeat(64) as Hex;
    const dummySignature = smartSessionModule.getDummySignature(emptyBytes32);
    // console.log("dummySignature", dummySignature)
    expect(dummySignature).toBeDefined();


    const pkey = generatePrivateKey()
    const sessionSignerAccount = privateKeyToAccount(pkey)
    const sessionKeyEOA = sessionSignerAccount.address

    const sessionRequestedInfo: CreateSessionDataParams = {
      sessionPublicKey: sessionKeyEOA,
      sessionValidatorAddress: TEST_CONTRACTS.SimpleSigner.address,
      sessionKeyData: toHex(toBytes(sessionKeyEOA)),
      contractAddress: TEST_CONTRACTS.Counter.address, // counter address
      functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
      rules: [], // no other rules and conditions applied
      valueLimit: BigInt(0)
    }

    const sessionsEnableData = await smartSessionModule.createSessionData([sessionRequestedInfo])
    console.log("sessionsEnableData", sessionsEnableData)
    expect(sessionsEnableData).toBeDefined()

    const tx: Transaction = {
      to: TEST_CONTRACTS.SmartSession.address,
      data: sessionsEnableData
    }
    
    const { wait } = await smartAccount.sendTransaction(tx)
    const { success } = await wait()
    expect(success).toBe(true)

    // todo: btw add read methods to get enabled sessions for a smart acccount
  }, 60000)

  test("should make use of already enabled session (USE mode) to transfer ERC20 using a session key", async () => {})
})
