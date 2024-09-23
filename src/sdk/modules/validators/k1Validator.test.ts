import { encodeAbiParameters, encodePacked, http, type Account, type Address, type Chain } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
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

  beforeAll(async () => {
    network = await toNetwork()

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

  test.skip("should send eth", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendTransaction({
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

  test("should install k1 validator with 1 owner", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: addresses.K1Validator,
        data: encodePacked(["address"], [account.address])
      }
    })

    if (!isInstalledBefore) {
      const hash = await nexusClient.installModule({
        module: {
          address: addresses.K1Validator,
          type: "validator",
          data: encodePacked(["address"], [account.address])
        }
      })

      const { success: installSuccess } =
        await nexusClient.waitForUserOperationReceipt({ hash })
      expect(installSuccess).toBe(true)

      const [installedValidators] = await nexusClient.getInstalledValidators({})

      const prevModule = await nexusClient.getPreviousModule({
        module: {
          address: addresses.K1Validator,
          type: "validator"
        },
        installedValidators
      })

      const deInitData = encodeAbiParameters(
        [
          { name: "prev", type: "address" },
          { name: "disableModuleData", type: "bytes" }
        ],
        [prevModule, encodePacked(["address"], [account.address])]
      )

      const hashUninstall = nexusClient.uninstallModule({
        module: {
          address: addresses.K1Validator,
          type: "validator",
          data: deInitData
        }
      })

      expect(hashUninstall).rejects.toThrow()
    } else {
      const [installedValidators] = await nexusClient.getInstalledValidators({})

      const prevModule = await nexusClient.getPreviousModule({
        module: {
          address: addresses.K1Validator,
          type: "validator"
        },
        installedValidators
      })

      const deInitData = encodeAbiParameters(
        [
          { name: "prev", type: "address" },
          { name: "disableModuleData", type: "bytes" }
        ],
        [prevModule, encodePacked(["address"], [account.address])]
      )

      const hashUninstall = nexusClient.uninstallModule({
        module: {
          address: addresses.K1Validator,
          type: "validator",
          data: deInitData
        }
      })

      expect(hashUninstall).rejects.toThrow()
    }
    // Get installed modules
  })
})
