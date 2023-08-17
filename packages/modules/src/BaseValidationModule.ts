import { Signer } from 'ethers'
import { Logger } from '@biconomy/common'
import { Bytes, BytesLike, hexConcat, hexZeroPad, hexlify } from 'ethers/lib/utils'
import { BaseValidationModuleConfig } from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'
import { IValidationModule } from './interfaces/IValidationModule'

export abstract class BaseValidationModule implements IValidationModule {
  moduleAddress: string
  entryPointAddress: string

  constructor(moduleConfig: BaseValidationModuleConfig) {
    const { moduleAddress, entrypointAddress } = moduleConfig

    // In child class fetch based on provided version
    this.moduleAddress = moduleAddress
    this.entryPointAddress = entrypointAddress || DEFAULT_ENTRYPOINT_ADDRESS
  }

  async getAddress(): Promise<string> {
    return this.moduleAddress
  }

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
