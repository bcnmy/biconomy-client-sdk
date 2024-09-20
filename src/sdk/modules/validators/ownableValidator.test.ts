import {
  getAddOwnableValidatorOwnerAction,
  getOwnableValidator,
  getOwnableValidatorSignature,
  getSetOwnableValidatorThresholdAction
} from "@rhinestone/module-sdk"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type PublicClient,
  encodePacked,
  encodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  publicActions,
  zeroAddress
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { TEST_CONTRACTS } from "../../../test/callDatas"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getBalance,
  getTestAccount,
  getTestSmartAccountClient,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import addresses from "../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { createOwnableValidatorModule } from "../.."

describe("modules.ownableValidator", async () => {
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
    network = await toNetwork("FILE_LOCALHOST")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await getTestSmartAccountClient({
      account,
      chain,
      bundlerUrl
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should install ownable validator and perform operations", async () => {
    // Install ownable validator
    const installHash = await nexusClient.installModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
        data: encodeAbiParameters(
          [
            { name: "threshold", type: "uint256" },
            { name: "owners", type: "address[]" }
          ],
          [BigInt(1), [account.address]]
        )
      }
    })
    const { success: installSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: installHash })
    expect(installSuccess).toBe(true)
  })

  test("should add accountTwo as owner", async () => {
    const addOwnerExecution = await getAddOwnableValidatorOwnerAction({
      owner: recipient.address,
      client: nexusClient.client as PublicClient,
      account: {
        address: nexusClient.account.address,
        type: "nexus",
        deployedOnChains: []
      }
    })

    if ("callData" in addOwnerExecution) {
      const userOpHash = await nexusClient.sendTransaction({
        calls: [
          {
            to: TEST_CONTRACTS.OwnableValidator.address,
            data: addOwnerExecution.callData
          }
        ]
      })
      expect(userOpHash).toBeDefined()
    } else {
      throw new Error("Failed to get add owner execution")
    }

    const owners = await testClient.readContract({
      address: TEST_CONTRACTS.OwnableValidator.address,
      abi: parseAbi(["function getOwners(address account) external view returns (address[] ownersArray)"]),
      functionName: "getOwners",
      args: [nexusClient.account.address]
    })
    console.log(owners, "owners");
    expect(owners).toContain(recipient.address)
  })

  test("should set threshold to 2", async () => {
    const isInstalled = await nexusClient.isModuleInstalled({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
      },
    })
    expect(isInstalled).toBe(true)
    // Set threshold
    const calldata = encodeFunctionData({
      functionName: "setThreshold",
      abi: parseAbi(["function setThreshold(uint256 _threshold) external"]),
      args: [BigInt(2)]
    })
    const userOpHash = await nexusClient.sendTransaction({
      calls: [
        {
          to: TEST_CONTRACTS.OwnableValidator.address,
          data: calldata
        }
      ]
    })
    console.log(userOpHash, "userOpHash");
    expect(userOpHash).toBeDefined()
  }, 90000)

  // @todo Fix this test, multi signature is not implemented yet
  test.skip("should need 2 signatures to send a user operation", async () => {
    const k1ValidationModule = nexusClient.account.getActiveValidationModule()
    console.log(k1ValidationModule, "k1ValidationModule");

    const ownableValidationModule = await createOwnableValidatorModule({
      smartAccount: nexusClient.account,
      address: TEST_CONTRACTS.OwnableValidator.address,
      owners: [account.address, recipient.address],
      threshold: 2
    })

    nexusClient.account.setActiveValidationModule(ownableValidationModule)

    console.log(nexusClient.account.getActiveValidationModule(), "active module");

    let dummyUserOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        }
      ],
      // signature: ownableValidationModule.getDummySignature()
    })
    const dummyUserOpHash = await nexusClient.account.getUserOpHash(dummyUserOp)
    const signature1 = await account?.signMessage?.({ message: dummyUserOpHash })
    const signature2 = await recipient?.signMessage?.({ message: dummyUserOpHash })
    const multiSignature = getOwnableValidatorSignature({ signatures: [signature1!, signature2!] })
    // dummyUserOp.signature = multiSignature
    // const userOpHash = await nexusClient.sendUserOperation(dummyUserOp,)
    const userOpHash = await nexusClient.sendTransaction({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        }
      ],
      signature: multiSignature
    })
    expect(userOpHash).toBeDefined()
  })

  test.skip("should uninstall ownable validator", async () => {
    // Uninstall ownable validator
    const [installedValidators] = await nexusClient.getInstalledValidators({});
    const prevModule = await nexusClient.getPreviousModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
      },
      installedValidators
    })
    const deInitData = encodeAbiParameters(
      [
        { name: "prev", type: "address" },
        { name: "disableModuleData", type: "bytes" }
      ],
      [prevModule, "0x"]
    )
    const uninstallHash = await nexusClient.uninstallModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
        data: deInitData
      }
    })
    const { success: uninstallSuccess } = await nexusClient.waitForUserOperationReceipt({ hash: uninstallHash })
    expect(uninstallSuccess).toBe(true)
  })
})
