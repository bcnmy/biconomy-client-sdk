import { Address, Hex } from "viem"
import { SmartAccountSigner, UserOperationStruct } from "../../accounts/utils/types"

export type K1ValidatorModuleConfig = {
    moduleAddress: Address
    signer: SmartAccountSigner
    version?: string
    entryPointAddress?: Address
    index?: bigint
}

export type BaseValidationModule = {
    entryPointAddress: Address
    validateUserOp(
        userOp: Partial<UserOperationStruct>,
        userOpHash: Hex
    ): Promise<number>
    isValidSignatureWithSender(
        sender: Address,
        hash: Hex,
        data: Hex
    ): Promise<Hex>
    getModuleInstallData(): Promise<Hex>
    getModuleUninstallData(): Promise<Hex>
    signUserOpHash(userOpHash: Hex): Promise<Hex>
    signMessage(message: Hex): Promise<Hex>
    getModuleAddress(): Address
    getSigner(): Promise<SmartAccountSigner>
    getDummySignature(): Promise<Hex>
}

export enum ModuleType {
    Validation = 1,
    Execution = 2,
    Fallback = 3,
    Hooks = 4,
  }