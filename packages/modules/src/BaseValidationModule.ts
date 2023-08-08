import { EntryPoint_v100, Logger } from '@biconomy/common'
import { Signer } from 'ethers'
import { Bytes, BytesLike, hexConcat, hexZeroPad, hexlify } from 'ethers/lib/utils'
import { BaseValidationModuleConfig } from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'

// Note: Interface may be added
export abstract class BaseValidationModule /*implements*/ {
  moduleAddress: string
  entryPointAddress: string
  // entryPoint!: EntryPoint_v100 // Maybe IEntryPoint // May be defined in child class
  // chainId!: ChainId
  // signer!: Signer
  validUntil: number
  validAfter: number

  constructor(moduleConfig: BaseValidationModuleConfig) {
    const { moduleAddress, entrypointAddress, validAfter, validUntil } = moduleConfig

    this.moduleAddress = moduleAddress
    this.entryPointAddress = entrypointAddress || DEFAULT_ENTRYPOINT_ADDRESS
    this.validUntil = validUntil ?? 0
    this.validAfter = validAfter ?? 0
  }

  async getAddress(): Promise<string> {
    return this.moduleAddress
  }

  setEntryPointAddress(entryPointAddress: string) {
    this.entryPointAddress = entryPointAddress
  }

  abstract getInitData(): Promise<string>

  // abstract getDummySignature(): Promise<string>

  // Review naming convention for getter
  abstract getSigner(): Promise<Signer>

  abstract signUserOp(userOperation: UserOperation): Promise<string>

  abstract signMessage(message: Bytes | string): Promise<string>
}
