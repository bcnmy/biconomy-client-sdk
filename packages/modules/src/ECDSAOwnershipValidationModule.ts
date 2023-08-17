import { Logger, getUserOpHash } from '@biconomy/common'
import { EntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import { Signer, ethers } from 'ethers'
import { Bytes, BytesLike, hexConcat, arrayify, hexZeroPad, hexlify } from 'ethers/lib/utils'
import {
  BaseValidationModuleConfig,
  ECDSAOwnershipValidationModuleConfig,
  ModuleVersion
} from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { DEFAULT_ENTRYPOINT_ADDRESS, ECDSA_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { BaseValidationModule } from './BaseValidationModule'

// Could be renamed with suffix API
export class ECDSAOwnershipValidationModule extends BaseValidationModule {
  owner: Signer
  chainId: ChainId
  moduleAddress!: string
  DEFAULT_VERSION: ModuleVersion = 'V1_0_0'
  // entryPoint!: EntryPoint

  constructor(moduleConfig: ECDSAOwnershipValidationModuleConfig) {
    super(moduleConfig)
    if (moduleConfig.moduleAddress) {
      this.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = ECDSA_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version]
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`)
      }
      this.moduleAddress = moduleAddr
      this.DEFAULT_VERSION = moduleConfig.version as ModuleVersion
    }
    this.owner = moduleConfig.signer
    this.chainId = moduleConfig.chainId
  }

  getAddress(): string {
    return this.moduleAddress
  }

  async getSigner(): Promise<Signer> {
    return await Promise.resolve(this.owner)
  }

  getDummySignature(): string {
    return '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9cf3caaa21db25f16ad6db43eb9932ab77c8e76000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000'
  }

  // Note: other modules may need additional attributes to build init data
  async getInitData(): Promise<string> {
    const ecdsaOwnerAddress = await this.owner.getAddress()
    const moduleRegistryAbi = 'function initForSmartAccount(address owner)'
    const ecdsaModuleRegistryInterface = new ethers.utils.Interface([moduleRegistryAbi])
    const ecdsaOwnershipInitData = ecdsaModuleRegistryInterface.encodeFunctionData(
      'initForSmartAccount',
      [ecdsaOwnerAddress]
    )
    return ecdsaOwnershipInitData
  }

  async signUserOp(userOp: UserOperation): Promise<string> {
    const userOpHash = getUserOpHash(userOp, this.entryPointAddress, this.chainId)
    return hexlify(await this.owner.signMessage(arrayify(userOpHash)))
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this.owner.signMessage(message)
  }
}
