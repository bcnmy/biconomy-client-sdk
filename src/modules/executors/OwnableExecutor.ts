import {
  type Address,
  type Hex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  parseAbi,
} from "viem"
import { SENTINEL_ADDRESS } from "../../account"
import type { NexusSmartAccount } from "../../account/NexusSmartAccount"
import type { UserOperationStruct } from "../../account"
import { BaseExecutionModule } from "../base/BaseExecutionModule"
import type { Execution, Module } from "../utils/Types"

export class OwnableExecutorModule extends BaseExecutionModule {
  smartAccount!: NexusSmartAccount
  public owners: Address[]
  private address: Address

  public constructor(
    module: Module,
    smartAccount: NexusSmartAccount,
    owners: Address[],
    address: Address,
  ) {
    super(module, smartAccount.getSigner())
    this.smartAccount = smartAccount
    this.owners = owners
    this.data = module.data ?? "0x"
    this.address = address
  }

  public static async create(
    smartAccount: NexusSmartAccount,
    address: Address,
    owner: Address
  ): Promise<OwnableExecutorModule> {
    const module: Module = {
      moduleAddress: address,
      type: "executor",
      data: encodePacked(["address"], [owner]),
      additionalContext: "0x"
    }
    const isInitialized = await smartAccount.publicClient.readContract({
      address,
      abi: parseAbi([
        "function isInitialized(address smartAccount) public view returns (bool)"
      ]),
      functionName: "isInitialized",
      args: [await smartAccount.getAddress()]
    })
    if (isInitialized) {
      const owners = await smartAccount.publicClient.readContract({
        address,
        abi: parseAbi([
          "function getOwners(address account) external view returns (address[])"
        ]),
        functionName: "getOwners",
        args: [await smartAccount.getAddress()]
      })
      return new OwnableExecutorModule(
        module,
        smartAccount,
        owners as Address[],
        address,
      )
    } else {
      return new OwnableExecutorModule(
        module,
        smartAccount,
        [owner],
        address,
      )
    }
  }

  public async getExecuteUserOp(
    execution: Execution | Execution[],
    senderSmartAccount?: NexusSmartAccount
  ): Promise<Partial<UserOperationStruct>> {
    let calldata: Hex
    if (Array.isArray(execution)) {
      calldata = encodeFunctionData({
        functionName: "executeBatchOnOwnedAccount",
        abi: parseAbi([
          "function executeBatchOnOwnedAccount(address ownedAccount, bytes callData)"
        ]),
        args: [
          await this.smartAccount.getAddress(),
          encodeAbiParameters(
            [
              {
                components: [
                  { name: "target", type: "address" },
                  { name: "value", type: "uint256" },
                  { name: "callData", type: "bytes" }
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
          await this.smartAccount.getAddress(),
          encodePacked(
            ["address", "uint256", "bytes"],
            [execution.target, BigInt(Number(execution.value)), execution.callData]
          )
        ]
      })
    }
    const transaction = {
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    }
    if (senderSmartAccount) {
      return await senderSmartAccount.buildUserOp([transaction])
    }
    return await this.smartAccount.buildUserOp([transaction])
  }

  public async addOwnerUserOp(newOwner: Address): Promise<Partial<UserOperationStruct>> {
    const callData = encodeFunctionData({
      functionName: "addOwner",
      abi: parseAbi(["function addOwner(address owner)"]),
      args: [newOwner]
    })
    const transaction = {
      to: this.moduleAddress,
      data: callData,
      value: 0n
    }
    return await this.smartAccount.buildUserOp([transaction])
  }

  public async removeOwnerUserOp(ownerToRemove: Address): Promise<Partial<UserOperationStruct>> {
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

    const transaction = {
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    }
    return await this.smartAccount.buildUserOp([transaction])
  }

  public async getOwners(
    accountAddress?: Address
  ): Promise<Address[]> {
    const owners = await this.smartAccount.publicClient.readContract({
      address: this.moduleAddress,
      abi: parseAbi([
        "function getOwners(address account) external view returns (address[])"
      ]),
      functionName: "getOwners",
      args: [accountAddress ?? (await this.smartAccount.getAddress())]
    })

    return owners as Address[]
  }

  public async isModuleInitialized(smartAccount?: Address): Promise<any> {
    return await this.smartAccount.publicClient.readContract({
      address: this.moduleAddress,
      abi: parseAbi([
        "function isInitialized(address smartAccount) public view returns (bool)"
      ]),
      functionName: "isInitialized",
      args: [await this.smartAccount.getAddress()]
    })
  }
}
