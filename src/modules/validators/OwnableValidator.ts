import {
  type Address,
  decodeAbiParameters,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  parseAbi,
  parseAbiParameters
} from "viem"
import type { Hex } from "viem"
import type { NexusSmartAccount } from "../../account/NexusSmartAccount.js"
import {
  ModuleType,
  SENTINEL_ADDRESS
} from "../../account/index.js"
import type { UserOpReceipt } from "../../bundler/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { V3ModuleInfo } from "../utils/Types.js"
import { OWNABLE_VALIDATOR } from "../utils/Constants.js"

export class OwnableValidator extends BaseValidationModule {
  public smartAccount: NexusSmartAccount
  public owners: Address[]
  public threshold: number

  private constructor(
    moduleConfig: V3ModuleInfo,
    smartAccount: NexusSmartAccount
  ) {
    const moduleData = decodeAbiParameters(
      parseAbiParameters("uint256 threshold, address[] owners"),
      moduleConfig.data
    )
    super(moduleConfig, smartAccount.getSmartAccountOwner())
    this.threshold = Number(moduleData[0])
    this.owners = [...moduleData[1]] as Address[]
    this.smartAccount = smartAccount
  }

  public static async create(
    smartAccount: NexusSmartAccount,
    threshold: number,
    owners: Address[],
    hook?: Address
  ): Promise<OwnableValidator> {
    if (
      !owners.includes(await smartAccount.getSmartAccountOwner().getAddress())
    ) {
      throw Error("Signer needs to be one of the owners")
    }
    const installData = encodeAbiParameters(
      [
        { name: "threshold", type: "uint256" },
        { name: "owners", type: "address[]" }
      ],
      [BigInt(threshold), owners]
    )
    const moduleInfo: V3ModuleInfo = {
      module: OWNABLE_VALIDATOR,
      type: ModuleType.Validation,
      data: installData,
      additionalContext: "0x",
      hook
    }
    const instance = new OwnableValidator(moduleInfo, smartAccount)
    return instance
  }

  public async setThreshold(threshold: number): Promise<UserOpReceipt> {
    const calldata = encodeFunctionData({
      functionName: "setThreshold",
      abi: parseAbi(["function setThreshold(uint256 _threshold)"]),
      args: [BigInt(threshold)]
    })
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async removeOwner(owner: Address): Promise<UserOpReceipt> {
    const owners = await this.getOwners()
    let prevOwner: Address

    const currentOwnerIndex = owners.findIndex((o: Address) => o === owner)

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
      args: [prevOwner, owner]
    })

    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async addOwner(owner: Address): Promise<UserOpReceipt> {
    const calldata = encodeFunctionData({
      functionName: "addOwner",
      abi: parseAbi(["function addOwner(address owner)"]),
      args: [owner]
    })
    const response = await this.smartAccount.sendTransaction({
      to: this.moduleAddress,
      data: calldata,
      value: 0n
    })
    const receipt = await response.wait()
    return receipt
  }

  public async getOwners(): Promise<Address[]> {
    try {
      const owners = (await this.smartAccount.publicClient.readContract({
        address: OWNABLE_VALIDATOR,
        abi: parseAbi([
          "function getOwners(address account) external view returns (address[])"
        ]),
        functionName: "getOwners",
        args: [await this.smartAccount.getAccountAddress()]
      })) as Address[]

      return owners
    } catch (err) {
      console.error(err)
      return []
    }
  }

  public getMockSignature(): Hex {
    return "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c"
  }
}
