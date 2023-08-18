import { Signer } from 'ethers'
import { Logger } from '@biconomy/common'
import { Bytes, BytesLike, hexConcat, hexZeroPad, hexlify } from 'ethers/lib/utils'
import { BaseValidationModuleConfig } from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'
import { IValidationModule } from './interfaces/IValidationModule'

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

  abstract getDummySignature(): string

  // Review naming convention for getter
  abstract getSigner(): Promise<Signer>

  abstract signUserOp(userOperation: UserOperation): Promise<string>

  abstract signMessage(message: Bytes | string): Promise<string>
}
