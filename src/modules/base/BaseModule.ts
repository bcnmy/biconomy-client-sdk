import { type Address, type Hex, encodeFunctionData, parseAbi } from "viem"
import type { SmartAccountSigner } from "../../account/index.js"
import { ENTRYPOINT_ADDRESS } from "../../contracts/index.js"
import type { ModuleType, ModuleVersion, V3ModuleInfo } from "../utils/Types.js"

export abstract class BaseModule {
  moduleAddress: Address
  data: Hex
  additionalContext: Hex
  type: ModuleType
  hook?: Address
  version: ModuleVersion = "1.0.0-beta"
  entryPoint: Address = ENTRYPOINT_ADDRESS
  signer: SmartAccountSigner

  constructor(moduleInfo: V3ModuleInfo, signer: SmartAccountSigner) {
    this.moduleAddress = moduleInfo.module
    this.data = moduleInfo.data
    this.additionalContext = moduleInfo.additionalContext
    this.hook = moduleInfo.hook
    this.type = moduleInfo.type
    this.signer = signer
  }

  public installModule(): Hex {
    const installModuleData = encodeFunctionData({
      abi: parseAbi([
        "function installModule(uint256 moduleTypeId, address module, bytes calldata initData) external"
      ]),
      functionName: "installModule",
      args: [BigInt(this.type), this.moduleAddress, this.data ?? "0x"]
    })

    return installModuleData
  }

  public uninstallModule(uninstallData?: Hex): Hex {
    const uninstallModuleData = encodeFunctionData({
      abi: parseAbi([
        "function uninstallModule(uint256 moduleTypeId, address module, bytes calldata initData) external"
      ]),
      functionName: "uninstallModule",
      args: [BigInt(this.type), this.moduleAddress, uninstallData ?? "0x"]
    })
    return uninstallModuleData
  }

  /**
   * Determines if the module matches a specific module type.
   * @dev Should return true if the module corresponds to the type ID, false otherwise.
   * @param moduleTypeId Numeric ID of the module type as per ERC-7579 specifications.
   * @returns True if the module is of the specified type, false otherwise.
   */
  public isModuleType(moduleTypeId: bigint): Hex {
    const isModuleTypeData = encodeFunctionData({
      abi: parseAbi([
        "function isModuleType(uint256 moduleTypeId) external view returns (bool)"
      ]),
      functionName: "isModuleType",
      args: [moduleTypeId]
    })
    return isModuleTypeData
  }

  /**
   * Checks if the module has been initialized for a specific smart account.
   * @dev Returns true if initialized, false otherwise.
   * @param smartAccount Address of the smart account to check for initialization status.
   * @returns True if the module is initialized for the given smart account, false otherwise.
   */
  public isInitialized(smartAccount: Address): Hex {
    const isInitializedeData = encodeFunctionData({
      abi: parseAbi([
        "function isInitialized(address smartAccount) external view returns (bool)"
      ]),
      functionName: "isInitialized",
      args: [smartAccount]
    })
    return isInitializedeData
  }

  public getAddress(): Hex {
    return this.moduleAddress
  }

  public getVersion(): string {
    return this.version
  }

  public getEntryPoint(): string {
    return this.version
  }
}
