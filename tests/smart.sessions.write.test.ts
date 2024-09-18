import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  toBytes,
  toHex,
  encodeFunctionData,
  parseAbi,
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { convertSigner, CreateSessionDataParams, createSmartSessionModule, parseReferenceValue, Session, Transaction } from "../src"
import {
  type NexusSmartAccount,
  createSmartAccountClient
} from "../src/account"
import policies, {
  getPermissionId,
  isSessionEnabled,
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
// import addresses from "../src/__contracts/addresses"
// import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { CounterAbi } from "./src/__contracts/abi"
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
  // Note: need to cache permissionId currently for further use
  let permissionIdCached: Hex

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

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await smartAccount.isModuleInstalled({
      type: "validator",
      moduleAddress: TEST_CONTRACTS.SmartSession.address
    })

    expect(isInstalledBefore).toBe(true)

    const smartAccountSigner = await convertSigner(walletClient)

    const smartSessionModule = await createSmartSessionModule(
      smartAccount.publicClient,
      smartAccountSigner.signer,
      TEST_CONTRACTS.SmartSession.address
    )
     
    // Generate empty bytes32 hex string for dummy permisisonId
    const emptyBytes32 = "0x" + "0".repeat(64) as Hex;
    const dummySignature = smartSessionModule.getDummySignature({ permissionId: emptyBytes32 });
    // console.log("dummySignature", dummySignature)
    expect(dummySignature).toBeDefined();

    // make EOA owner of SA session key as well
    const sessionKeyEOA = account.address

    const sessionRequestedInfo: CreateSessionDataParams = {
      sessionPublicKey: sessionKeyEOA,
      sessionValidatorAddress: TEST_CONTRACTS.SimpleSigner.address,
      sessionKeyData: toHex(toBytes(sessionKeyEOA)),
      contractAddress: TEST_CONTRACTS.Counter.address, // counter address
      functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
      rules: [], // no other rules and conditions applied
      valueLimit: BigInt(0)
    }

    const createSessionDataResponse = await smartSessionModule.createSessionData([sessionRequestedInfo])
    // console.log("sessionsEnableData", createSessionDataResponse.sessionsEnableData)
    expect(createSessionDataResponse.sessionsEnableData).toBeDefined()

    const permissionIds = createSessionDataResponse.permissionIds
    expect(permissionIds.length).toBe(1)
    const permissionId = permissionIds[0]
    permissionIdCached = permissionId

    const tx: Transaction = {
      to: TEST_CONTRACTS.SmartSession.address,
      data: createSessionDataResponse.sessionsEnableData
    }
    
    const { wait } = await smartAccount.sendTransaction(tx)
    const { success } = await wait()
    expect(success).toBe(true)

    const isEnabled = await isSessionEnabled({
      client: smartAccount.publicClient,
      smartAccountAddress,
      permissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("should make use of already enabled session (USE mode) to increment a counter using a session key", async () => {

    const isEnabled = await isSessionEnabled({
      client: smartAccount.publicClient,
      smartAccountAddress,
      permissionId:permissionIdCached
    })
    expect(isEnabled).toBe(true)

    // same signer for session key eoa above
    const smartAccountSigner = await convertSigner(walletClient)

    // same as eoa owner of SA.
    const smartSessionModule = await createSmartSessionModule(
      smartAccount.publicClient,
      smartAccountSigner.signer,
      TEST_CONTRACTS.SmartSession.address
    )
    // set active validation module
    smartAccount.setActiveValidationModule(smartSessionModule)

    // need permissionId from session object (both from some cache)
    
    const tx: Transaction = {
      to: TEST_CONTRACTS.Counter.address,
      data: encodeFunctionData({
        abi: CounterAbi,
        functionName: "incrementNumber",
        args: []
      })
    }

    const counterBefore = await smartAccount.publicClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    // Make userop to increase counter
    const { wait } = await smartAccount.sendTransaction(tx, { moduleInfo: { permissionId: permissionIdCached } })
    const { success } = await wait()
    expect(success).toBe(true)

    const counterAfter = await smartAccount.publicClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)
})
