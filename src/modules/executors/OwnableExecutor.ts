import {
  type Address,
  type Hex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  parseAbi
} from "viem"
import { SENTINEL_ADDRESS } from "../../account"
import type { NexusSmartAccount } from "../../account/NexusSmartAccount"
import type { UserOpReceipt } from "../../bundler"
import { BaseExecutionModule } from "../base/BaseExecutionModule"
import { OWNABLE_EXECUTOR } from "../utils/Constants"
import type { Execution, Module } from "../utils/Types"

export class OwnableExecutorModule extends BaseExecutionModule {
  smartAccount!: NexusSmartAccount
  public owners: Address[]

  public constructor(
    module: Module,
    smartAccount: NexusSmartAccount,
    owners: Address[]
  ) {
    super(module, smartAccount.getSigner())
    this.smartAccount = smartAccount
    this.owners = owners
    this.data = module.data ?? "0x"
  }

  public static async create(
    smartAccount: NexusSmartAccount,
    data?: Hex
  ): Promise<OwnableExecutorModule> {
    const module: Module = {
      moduleAddress: OWNABLE_EXECUTOR,
      type: "executor",
      data: data ?? "0x",
      additionalContext: "0x"
    }
    const owners = await smartAccount.publicClient.readContract({
      address: OWNABLE_EXECUTOR,
      abi: parseAbi([
        "function getOwners(address account) external view returns (address[])"
      ]),
      functionName: "getOwners",
      args: [await smartAccount.getAddress()]
    })
    const instance = new OwnableExecutorModule(
      module,
      smartAccount,
      owners as Address[]
    )
    return instance
  }

  public async execute(
    execution: Execution | Execution[],
    accountAddress?: Address
  ): Promise<UserOpReceipt> {
    let calldata: Hex
    if (Array.isArray(execution)) {
      calldata = encodeFunctionData({
        functionName: "executeBatchOnOwnedAccount",
        abi: parseAbi([
          "function executeBatchOnOwnedAccount(address ownedAccount, bytes callData)"
        ]),
        args: [
          accountAddress ?? (await this.smartAccount.getAddress()),
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
          accountAddress ?? (await this.smartAccount.getAddress()),
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
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async addOwner(newOwner: Address): Promise<UserOpReceipt> {
    const callData = encodeFunctionData({
      functionName: "addOwner",
      abi: parseAbi(["function addOwner(address owner)"]),
      args: [newOwner]
    })
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: callData,
      value: 0n
    })
    const receipt = await response.wait()
    if (receipt.success) {
      this.owners.push(newOwner)
    }
    return receipt
  }

  public async removeOwner(ownerToRemove: Address): Promise<UserOpReceipt> {
    const owners = await this.getOwners()
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

    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    })

    const receipt = await response.wait()
    if (receipt.success) {
      this.owners = this.owners.filter((o: Address) => o !== ownerToRemove)
    }
    return receipt
  }

  public async getOwners(accountAddress?: Address): Promise<Address[]> {
    const owners = await this.smartAccount.publicClient.readContract({
      address: OWNABLE_EXECUTOR,
      abi: parseAbi([
        "function getOwners(address account) external view returns (address[])"
      ]),
      functionName: "getOwners",
      args: [accountAddress ?? (await this.smartAccount.getAddress())]
    })

    return owners as Address[]
  }
}
