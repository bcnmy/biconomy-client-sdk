import {
  getAddOwnableExecutorOwnerAction,
  getExecuteBatchOnOwnedAccountAction,
  getExecuteOnOwnedAccountAction,
  getOwnableExecutorOwners,
  getRemoveOwnableExecutorOwnerAction
} from "@rhinestone/module-sdk"
import type { Address } from "viem"
import { ModuleType } from "../../account"
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
    let executorExecution: Execution
    if (Array.isArray(execution)) {
      executorExecution = getExecuteBatchOnOwnedAccountAction({
        ownedAccount: await this.smartAccount.getAddress(),
        executions: execution
      })
    } else {
      executorExecution = getExecuteOnOwnedAccountAction({
        ownedAccount: await this.smartAccount.getAddress(),
        execution
      })
    }
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: executorExecution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async addOwner(newOwner: Address): Promise<UserOpReceipt> {
    const execution: Execution = getAddOwnableExecutorOwnerAction({
      owner: newOwner
    })
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: execution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async removeOwner(ownerToRemove: Address): Promise<UserOpReceipt> {
    const execution: Execution = await getRemoveOwnableExecutorOwnerAction({
      // @ts-ignore
      client: this.smartAccount.publicClient,
      owner: ownerToRemove,
      account: await this.smartAccount.getAddress()
    })
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: execution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async getOwners(): Promise<Address[]> {
    const owners = await getOwnableExecutorOwners({
      account: await this.smartAccount.getAddress(),
      // @ts-ignore
      client: this.smartAccount.publicClient
    })
    return owners
  }
}
