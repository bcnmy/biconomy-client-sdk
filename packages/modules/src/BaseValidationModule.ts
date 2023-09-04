import { Signer } from 'ethers'
import { Bytes } from 'ethers/lib/utils'
import { BaseValidationModuleConfig, SessionParams } from './utils/Types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'
import { IValidationModule } from './interfaces/IValidationModule'

// TODO: Review try using generic types
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

  abstract getDummySignature(additionalInfo?: SessionParams): Promise<string>

  // Review naming convention for getter
  abstract getSigner(): Promise<Signer>

  abstract signUserOpHash(userOpHash: string, signerAdditionalInfo?: SessionParams): Promise<string>

  abstract signMessage(message: Bytes | string): Promise<string>
}
