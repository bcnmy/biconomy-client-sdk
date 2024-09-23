import { TEST_CONTRACTS } from './../../../test/callDatas';
import {
  getAddOwnableValidatorOwnerAction,
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
  zeroAddress,
  getAddress,
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import addresses from "../../__contracts/addresses"
import {
  createNexusClient,
  type NexusClient,
} from "../../clients/createNexusClient"
import { createK1ValidatorModule, createOwnableValidatorModule, toSigner } from "../.."
import { type OwnableValidator } from './OwnableValidator';
import { parseModuleTypeId } from '../../clients/decorators/erc7579/supportsModule';
import { K1ValidatorModule } from './K1ValidatorModule';

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
  let ownableValidatorModule: OwnableValidator
  let k1ValidatorModule: K1ValidatorModule
  beforeAll(async () => {
    network = await toNetwork("FILE_LOCALHOST")

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

    ownableValidatorModule = await createOwnableValidatorModule({
      smartAccount: nexusClient.account,
      address: TEST_CONTRACTS.OwnableValidator.address,
      owners: [account.address, recipient.address],
      threshold: 2
    })

    k1ValidatorModule = await createK1ValidatorModule(account)
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
      const transactionHash = await nexusClient.sendTransaction({
        calls: [
          {
            to: TEST_CONTRACTS.OwnableValidator.address,
            data: addOwnerExecution.callData
          }
        ]
      })
      expect(transactionHash).toBeDefined()
      const receipt = await testClient.waitForTransactionReceipt({ hash: transactionHash })
      expect(receipt.status).toBe("success")
    } else {
      throw new Error("Failed to get add owner execution")
    }

    const owners = await testClient.readContract({
      address: TEST_CONTRACTS.OwnableValidator.address,
      abi: parseAbi(["function getOwners(address account) external view returns (address[] ownersArray)"]),
      functionName: "getOwners",
      args: [nexusClient.account.address]
    })
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
    expect(userOpHash).toBeDefined()
  }, 90000)

  test("should need 2 signatures to send a user operation", async () => {
    const activeValidationModule = nexusClient.account.getActiveValidationModule()
    expect(activeValidationModule.address).toBe(addresses.K1Validator)

    nexusClient.account.setActiveValidationModule(ownableValidatorModule)
    const activeValidationModuleAfter = nexusClient.account.getActiveValidationModule()
    expect(activeValidationModuleAfter.address).toBe(TEST_CONTRACTS.OwnableValidator.address)

    let dummyUserOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        },
        {
          to: zeroAddress,
          data: "0x"
        }
      ],
    })
    const dummyUserOpHash = await nexusClient.account.getUserOpHash(dummyUserOp)
    const signature1 = await account?.signMessage?.({ message: { raw: dummyUserOpHash } })
    const signature2 = await recipient?.signMessage?.({ message: { raw: dummyUserOpHash } })
    const multiSignature = encodePacked(["bytes", "bytes"], [signature1!, signature2!])
    const userOpHash = await nexusClient.sendUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        },
        {
          to: zeroAddress,
          data: "0x"
        }
      ],
      signature: multiSignature
    })
    expect(userOpHash).toBeDefined()
    const { success: userOpSuccess } = await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
    expect(userOpSuccess).toBe(true)
  })

  test("should uninstall ownable validator", async () => {
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

    const uninstallCallData = encodeFunctionData({
      abi: [
        {
          name: "uninstallModule",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            {
              type: "uint256",
              name: "moduleTypeId"
            },
            {
              type: "address",
              name: "module"
            },
            {
              type: "bytes",
              name: "deInitData"
            }
          ],
          outputs: []
        }
      ],
      functionName: "uninstallModule",
      args: [parseModuleTypeId("validator"), getAddress(TEST_CONTRACTS.OwnableValidator.address), deInitData]
    })

    const userOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: nexusClient.account.address,
          data: uninstallCallData
        }
      ]
    })
    const userOpHash = await nexusClient.account.getUserOpHash(userOp)
    expect(userOpHash).toBeDefined()

    const signature1 = await account?.signMessage?.({ message: { raw: userOpHash } })
    const signature2 = await recipient?.signMessage?.({ message: { raw: userOpHash } })
    const multiSignature = encodePacked(["bytes", "bytes"], [signature1!, signature2!])
    const uninstallHash = await nexusClient.uninstallModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
        data: deInitData
      },
      signatureOverride: multiSignature
    })
    expect(uninstallHash).toBeDefined()
    const { success: userOpSuccess } = await nexusClient.waitForUserOperationReceipt({ hash: uninstallHash })
    expect(userOpSuccess).toBe(true)
  })
})
