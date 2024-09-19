import {
  type Account,
  type Address,
  type Chain,
  type Hash,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  parseAbi
} from "viem"
import { SENTINEL_ADDRESS } from "../../account/utils/Constants"
import { type Holder, toHolder } from "../../account/utils/toHolder"
import type { NexusClient } from "../../clients/createNexusClient"
import type { Module } from "../../clients/decorators/erc7579"
import { BaseExecutionModule } from "../base/BaseExecutionModule"
import type { Execution } from "../utils/Types"
export class OwnableExecutorModule extends BaseExecutionModule {
  public nexusClient: NexusClient
  public owners: Address[]
  public override address: Address

  public constructor(
    module: Module,
    nexusClient: NexusClient,
    owners: Address[],
    address: Address,
    holder: Holder
  ) {
    super(module, holder)
    this.nexusClient = nexusClient
    this.owners = owners
    this.context = module.context ?? "0x"
    this.address = address
  }

  public static async create(
    nexusClient: NexusClient,
    address: Address,
    context?: Hex
  ): Promise<OwnableExecutorModule> {
    const module: Module = {
      address: address,
      type: "executor",
      context: context ?? "0x",
      additionalContext: "0x"
    }
    const owners = await (
      nexusClient.account.client as PublicClient
    ).readContract({
      address,
      abi: parseAbi([
        "function getOwners(address account) external view returns (address[])"
      ]),
      functionName: "getOwners",
      args: [await nexusClient.account.getAddress()]
    })
    const holder = await toHolder({ holder: nexusClient.account.client } as {
      holder: WalletClient<Transport, Chain | undefined, Account>
    })
    return new OwnableExecutorModule(
      module,
      nexusClient,
      owners as Address[],
      address,
      holder
    )
  }

  public async execute(
    execution: Execution | Execution[],
    accountAddress?: Address
  ): Promise<Hash> {
    let calldata: Hex
    if (Array.isArray(execution)) {
      calldata = encodeFunctionData({
        functionName: "executeBatchOnOwnedAccount",
        abi: parseAbi([
          "function executeBatchOnOwnedAccount(address ownedAccount, bytes callData)"
        ]),
        args: [
          accountAddress ?? (await this.nexusClient.account.getAddress()),
          encodeAbiParameters(
            [
              {
                components: [
                  {
                    name: "target",
                    type: "address"
                  },
                  {
                    name: "value",
                    type: "uint256"
                  },
                  {
                    name: "callData",
                    type: "bytes"
                  }
                ],
                name: "Execution",
                type: "tuple[]"
              }
            ],
            [execution]
          )
        ]
      })
    } else {
      calldata = encodeFunctionData({
        functionName: "executeOnOwnedAccount",
        abi: parseAbi([
          "function executeOnOwnedAccount(address ownedAccount, bytes callData)"
        ]),
        args: [
          accountAddress ?? (await this.nexusClient.account.getAddress()),
          encodePacked(
            ["address", "uint256", "bytes"],
            [
              execution.target,
              BigInt(Number(execution.value)),
              execution.callData
            ]
          )
        ]
      })
    }
    return this.nexusClient.sendTransaction({
      calls: [{ to: this.address, data: calldata, value: 0n }]
    })
  }

  public async addOwner(newOwner: Address) {
    const callData = encodeFunctionData({
      functionName: "addOwner",
      abi: parseAbi(["function addOwner(address owner)"]),
      args: [newOwner]
    })
    return this.nexusClient.sendTransaction({
      calls: [{ to: this.address, data: callData, value: 0n }]
    })
  }

  public async removeOwner(ownerToRemove: Address) {
    const owners = await this.getOwners(this.address)
    let prevOwner: Address

    const currentOwnerIndex = owners.findIndex(
      (o: Address) => o === ownerToRemove
    )

    if (currentOwnerIndex === -1) {
      throw new Error("Owner not found")
    }
    if (currentOwnerIndex === 0) {
      prevOwner = SENTINEL_ADDRESS
    } else {
      prevOwner = getAddress(owners[currentOwnerIndex - 1])
    }

    const calldata = encodeFunctionData({
      functionName: "removeOwner",
      abi: parseAbi(["function removeOwner(address prevOwner, address owner)"]),
      args: [prevOwner, ownerToRemove]
    })

    return this.nexusClient.sendTransaction({
      calls: [
        {
          to: this.address,
          data: calldata,
          value: 0n
        }
      ]
    })
  }

  public async getOwners(
    moduleAddress: Address,
    accountAddress?: Address
  ): Promise<Address[]> {
    const owners = await (
      this.nexusClient.account.client as PublicClient
    ).readContract({
      address: moduleAddress,
      abi: parseAbi([
        "function getOwners(address account) external view returns (address[])"
      ]),
      functionName: "getOwners",
      args: [accountAddress ?? (await this.nexusClient.account.getAddress())]
    })

    return owners as Address[]
  }
}
