import {
  ModuleType,
  OWNABLE_VALIDATOR,
} from "../../account/index.js"
import type { V3ModuleInfo } from "../utils/Types.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { getAddOwnableValidatorOwnerAction, getInstallOwnableValidator, getOwnableValidatorMockSignature, getOwnableValidatorOwners, getRemoveOwnableValidatorOwnerAction, getSetOwnableValidatorThresholdAction } from "@rhinestone/module-sdk"
import { Address, decodeAbiParameters, parseAbiParameters } from "viem"
import { UserOpReceipt } from "../../bundler/index.js"
import { NexusSmartAccount } from "../../account/NexusSmartAccount.js"
import { Hex } from "viem"

export class OwnableValidator extends BaseValidationModule {

  public smartAccount: NexusSmartAccount
  public owners: Address[];
  public threshold: number;

  private constructor(moduleConfig: V3ModuleInfo, smartAccount: NexusSmartAccount) {
    const moduleData = decodeAbiParameters(parseAbiParameters('uint256 threshold, address[] owners'), moduleConfig.data);
    super(moduleConfig, smartAccount.getSmartAccountOwner())
    this.threshold = Number(moduleData[0]);
    this.owners = [...moduleData[1]] as Address[];
    this.smartAccount = smartAccount;
  }

  public static async create(
    smartAccount: NexusSmartAccount,
    threshold: number,
    owners: Address[],
    hook?: Address
  ): Promise<OwnableValidator> {
    if(!owners.includes(await smartAccount.getSmartAccountOwner().getAddress())){
      throw Error("Signer needs to be one of the owners")
    }
    const installData = await getInstallOwnableValidator({
      threshold,
      owners,
      hook
    })
    const moduleInfo: V3ModuleInfo = {
      module: OWNABLE_VALIDATOR,
      type: ModuleType.Validation,
      data: installData,
      additionalContext: "0x"
    }
    const instance = new OwnableValidator(moduleInfo, smartAccount)
    return instance
  }

  public async setThreshold(threshold: number): Promise<UserOpReceipt> {
    const execution = getSetOwnableValidatorThresholdAction(threshold);
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: execution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async removeOwner(owner: Address): Promise<UserOpReceipt> {
    const execution = getRemoveOwnableValidatorOwnerAction(this.smartAccount.publicClient, this.smartAccount, owner);
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: execution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async addOwner(owner: Address): Promise<UserOpReceipt> {
    const execution = getAddOwnableValidatorOwnerAction(owner);
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: execution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async getOwners(): Promise<UserOpReceipt> {
    const execution = getOwnableValidatorOwners(this.smartAccount, this.smartAccount.publicClient);
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: execution.callData,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public getMockSignature(): Hex {
    return getOwnableValidatorMockSignature();
  }
}
