import { TEST_CONTRACTS } from './../../../test/callDatas';
import {
    type Account,
    type Address,
    type Chain,
    encodePacked,
    http,
    parseAbi,
    PublicClient,
    toHex,
    WalletClient,
    zeroAddress,
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
import {
    createNexusClient,
    type NexusClient,
} from "../../clients/createNexusClient"
import { createK1ValidatorModule } from "../.."
import { K1ValidatorModule } from '../validators/K1ValidatorModule';
import { getAddOwnableExecutorOwnerAction, getExecuteOnOwnedAccountAction } from '@rhinestone/module-sdk';
import { waitForTransactionReceipt } from 'viem/actions';

describe("modules.ownableExecutor", async () => {
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

        k1ValidatorModule = await createK1ValidatorModule(account)
        nexusClient.account.setActiveValidationModule(k1ValidatorModule)
    })

    afterAll(async () => {
        await killNetwork([network?.rpcPort, network?.bundlerPort])
    })

    test("should install OwnableExecutor module", async () => {
        const isInstalled = await nexusClient.isModuleInstalled({
            module: {
                type: "executor",
                address: TEST_CONTRACTS.OwnableExecutorSepolia.address
            }
        })
        expect(isInstalled).toBe(false)

        const userOpHash = await nexusClient.installModule({
            module: {
                type: "executor",
                address: TEST_CONTRACTS.OwnableExecutorSepolia.address,
                data: encodePacked(
                    ["address"],
                    [account.address]
                )
            }
        })
        expect(userOpHash).toBeDefined()
        const receipt = await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
        expect(receipt.success).toBe(true)

        const isInstalledAfter = await nexusClient.isModuleInstalled({
            module: {
                type: "executor",
                address: TEST_CONTRACTS.OwnableExecutorSepolia.address
            }
        })
        expect(isInstalledAfter).toBe(true)
    })

    test("should add another EOA as executor", async () => {
        const execution = await getAddOwnableExecutorOwnerAction({ owner: recipientAddress, client: nexusClient.account.client as PublicClient, account: { address: nexusClient.account.address, type: "nexus", deployedOnChains: [] } })
        const userOpHash = await nexusClient.sendTransaction({
            calls: [
                {
                    to: TEST_CONTRACTS.OwnableExecutorSepolia.address,
                    data: execution.callData,
                    value: 0n
                }
            ]
        })
        expect(userOpHash).toBeDefined()
        const masterClient = nexusClient.account.client as MasterClient;
        const owners = await masterClient.readContract({
            address: TEST_CONTRACTS.OwnableExecutorSepolia.address,
            abi: parseAbi([
                "function getOwners(address account) external view returns (address[])"
            ]),
            functionName: 'getOwners',
            args: [nexusClient.account.address]
        })
        expect(owners).toContain(recipientAddress)
    })

    test("added executor EOA should execute user operation on smart account", async () => {
        const execution = {
            target: zeroAddress,
            callData: toHex("0x"),
            value: 0n
        }

        const executeOnOwnedAccountExecution = getExecuteOnOwnedAccountAction({
            execution,
            ownedAccount: nexusClient.account.address
        })

        const client = nexusClient.account.client as WalletClient;
        const hash = await client.sendTransaction({
            account: recipient,
            to: TEST_CONTRACTS.OwnableExecutorSepolia.address,
            data: executeOnOwnedAccountExecution.callData,
            chain,
            value: 0n
        })

        const receipt = await waitForTransactionReceipt(nexusClient.account.client as PublicClient, { hash })
        expect(receipt.status).toBe("success")
    })
})