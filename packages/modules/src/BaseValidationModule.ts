import { Signer } from 'ethers'
import { Bytes } from 'ethers/lib/utils'
import { BaseValidationModuleConfig, ModuleInfo } from './utils/Types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'
import { IValidationModule } from './interfaces/IValidationModule'

// <<TODO>>: <<Review>> try using generic types
// Need to solve it in SmartAccountV2 and it's config because for any module BaseValidationModule is used as type
export abstract class BaseValidationModule implements IValidationModule {
  entryPointAddress: string

  constructor(moduleConfig: BaseValidationModuleConfig) {
    const { entryPointAddress } = moduleConfig

    this.entryPointAddress = entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS
  }

  abstract getAddress(): string

  setEntryPointAddress(entryPointAddress: string) {
    this.entryPointAddress = entryPointAddress
  }

  abstract getInitData(): Promise<string>

  // Anything  required to get dummy signature can be passed as params
  abstract getDummySignature(params?: ModuleInfo): Promise<string>

  // <<review>> naming convention for getter
  abstract getSigner(): Promise<Signer>

  // Signer specific or any other additional information can be passed as params
  abstract signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string>

  abstract signMessage(message: Bytes | string): Promise<string>
}
