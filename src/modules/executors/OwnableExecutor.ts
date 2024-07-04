import {
  type Address,
  type Hex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  parseAbi
} from "viem"
import { ModuleType, SENTINEL_ADDRESS } from "../../account"
import type { NexusSmartAccount } from "../../account/NexusSmartAccount"
import type { UserOpReceipt } from "../../bundler"
import { BaseExecutionModule } from "../base/BaseExecutionModule"
import { OWNABLE_EXECUTOR } from "../utils/Constants"
import type { Execution, V3ModuleInfo } from "../utils/Types"

export class OwnableExecutorModule extends BaseExecutionModule {
  smartAccount!: NexusSmartAccount
  public constructor(
    moduleInfo: V3ModuleInfo,
    smartAccount: NexusSmartAccount
  ) {
    super(moduleInfo, smartAccount.getSigner())
    this.smartAccount = smartAccount
  }

  public static async create(
    smartAccount: NexusSmartAccount
  ): Promise<OwnableExecutorModule> {
    const signer = smartAccount.getSigner()
    const moduleInfo: V3ModuleInfo = {
      module: OWNABLE_EXECUTOR,
      type: ModuleType.Execution,
      data: await signer.getAddress(),
      additionalContext: "0x"
    }
    const instance = new OwnableExecutorModule(moduleInfo, smartAccount)
    return instance
  }

  public async executeFromExecutor(
    execution: Execution | Execution[]
  ): Promise<UserOpReceipt> {
    let calldata: Hex
    if (Array.isArray(execution)) {
      calldata = encodeFunctionData({
        functionName: "executeBatchOnOwnedAccount",
        abi: parseAbi([
          "function executeBatchOnOwnedAccount(address ownedAccount, bytes callData)"
        ]),
        args: [
          await this.smartAccount.getAccountAddress(),
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
            // @ts-ignore
            [executions]
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
          await this.smartAccount.getAccountAddress(),
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
    return receipt
  }

  public async getOwners(accountAddress?: Address): Promise<Address[]> {
    try {
      const owners = await this.smartAccount.publicClient.readContract({
        address: OWNABLE_EXECUTOR,
        abi: parseAbi([
          "function getOwners(address account) external view returns (address[])"
        ]),
        functionName: "getOwners",
        args: [accountAddress ?? (await this.smartAccount.getAccountAddress())]
      })

      return owners as Address[]
    } catch (err) {
      return []
    }
  }
}
