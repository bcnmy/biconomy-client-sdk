import { type Address, type Hex, encodeFunctionData, parseAbi } from "viem"
import {
  ENTRYPOINT_V07_ADDRESS,
  type ModuleType,
  type SmartAccountSigner
} from "../../account/index.js"
import type { ModuleVersion, V3ModuleInfo } from "../utils/Types.js"

export abstract class BaseModule {
  moduleAddress: Address
  data: Hex
  additionalContext: Hex
  type: ModuleType
  hook?: Address
  version: ModuleVersion = "1.0.0-beta"
  entryPoint: Address = ENTRYPOINT_V07_ADDRESS
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
