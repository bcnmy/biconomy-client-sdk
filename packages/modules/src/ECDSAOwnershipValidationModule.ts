import { EntryPoint_v100, Logger } from '@biconomy/common'
import { Signer, ethers } from 'ethers'
import { Bytes, BytesLike, hexConcat, arrayify, hexZeroPad, hexlify } from 'ethers/lib/utils'
import { BaseValidationModuleConfig, ECDSAOwnershipValidationModuleConfig } from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'
import { BaseValidationModule } from './BaseValidationModule'

// Could be renamed with suffic API
export class ECDSAOwnershipValidationModule extends BaseValidationModule /*implements*/ {
  signer: Signer
  entryPoint!: EntryPoint_v100 // Maybe IEntryPoint // May be defined in child class

  constructor(moduleConfig: ECDSAOwnershipValidationModuleConfig) {
    super(moduleConfig)
    this.signer = moduleConfig.signer
    // without passing instance we would need provider / rpcUrl and using address to build instance
    this.entryPoint = moduleConfig.entryPoint
  }

  // Note: other modules may need additional attributes to build init data
  async getInitData(): Promise<string> {
    return await this.signer.getAddress()
  }

  async getSigner(): Promise<Signer> {
    return await Promise.resolve(this.signer)
  }

  async getEnableData(): Promise<string> {
    const ecdsaOwnerAddress = await this.signer.getAddress()
    const ecdsaModuleRegistryAbi = 'function initForSmartAccount(address owner)'
    const ecdsaModuleRegistryInterface = new ethers.utils.Interface([ecdsaModuleRegistryAbi])
    const ecdsaOwnershipInitData = ecdsaModuleRegistryInterface.encodeFunctionData(
      'initForSmartAccount',
      [ecdsaOwnerAddress]
    )
    return ecdsaOwnershipInitData
  }

  async signUserOp(userOperation: UserOperation): Promise<string> {
    const userOpHash = await this.entryPoint.getUserOpHash({
      ...userOperation,
      signature: '0x'
    })
    return hexlify(await this.signer.signMessage(arrayify(userOpHash)))
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this.signer.signMessage(message)
  }
}
