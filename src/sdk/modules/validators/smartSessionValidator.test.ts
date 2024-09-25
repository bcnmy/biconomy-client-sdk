import { encodeAbiParameters, encodePacked, Hex, http, PublicClient, toBytes, toHex, type Account, type Address, type Chain } from "viem"
import { TEST_CONTRACTS } from './../../../test/callDatas';
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import addresses from "../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { CreateSessionDataParams, createSmartSessionValidatorModule, isSessionEnabled } from "../.."

describe("modules.k1Validator.write", async () => {
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
  let permissionIdCached: Hex

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: account,
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

  test("should send eth", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendUserOperation({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })
    const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(success).toBe(true)
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should install smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          address: addresses.SmartSession,
        }
      })

    if (!isInstalledBefore) {
        const hash = await nexusClient.installModule({
            module: {
              address: addresses.SmartSession,
              type: "validator",
              data: '0x'
            }
          })
    
          const { success: installSuccess } =
            await nexusClient.waitForUserOperationReceipt({ hash })
          expect(installSuccess).toBe(true)
    }
  }, 60000)

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          address: addresses.SmartSession,
        }
      });

    expect(isInstalledBefore).toBe(true)

    // const smartAccountSigner = await convertSigner(walletClient)

    const smartSessionModule = await createSmartSessionValidatorModule({
        smartAccount: nexusClient.account,
        address: TEST_CONTRACTS.SmartSession.address
    })
     
    // Generate empty bytes32 hex string for dummy permisisonId
    const emptyBytes32 = "0x" + "0".repeat(64) as Hex;
    const dummySignature = smartSessionModule.getDummySignature({ permissionId: emptyBytes32 });
    // console.log("dummySignature", dummySignature)
    expect(dummySignature).toBeDefined();

    // make EOA owner of SA session key as well
    const sessionKeyEOA = account.address

    // Todo: Add a negative test case for time range policy
    const sessionRequestedInfo: CreateSessionDataParams = {
      sessionPublicKey: sessionKeyEOA,
      sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
      sessionKeyData: toHex(toBytes(sessionKeyEOA)),
      sessionValidAfter: 0,
      sessionValidUntil: 0,
      actionPoliciesInfo: 
      [{
      contractAddress: TEST_CONTRACTS.Counter.address, // counter address
      functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
      validUntil: 0, // 1717001666
      validAfter: 0,
      rules: [], // no other rules and conditions applied
      valueLimit: BigInt(0) 
      }],
    }

    // single session
    const createSessionDataResponse = await smartSessionModule.createSessionData([sessionRequestedInfo])
    // console.log("sessionsEnableData", createSessionDataResponse.sessionsEnableData)
    expect(createSessionDataResponse.sessionsEnableData).toBeDefined()

    const permissionIds = createSessionDataResponse.permissionIds
    expect(permissionIds.length).toBe(1)
    const permissionId = permissionIds[0]
    permissionIdCached = permissionId

    const hash = await nexusClient.sendTransaction({
        calls: [
          {
            to: TEST_CONTRACTS.SmartSession.address,
            data: createSessionDataResponse.sessionsEnableData
          }
        ]
      })
    
    expect(hash).toBeDefined()
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")

    const isEnabled = await isSessionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: await nexusClient.account.getAddress(),
      permissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)
})
