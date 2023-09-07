import { Logger } from '@biconomy/common'
import { Signer, ethers } from 'ethers'
import { Bytes, arrayify } from 'ethers/lib/utils'
import { ECDSAOwnershipValidationModuleConfig, ModuleVersion } from './utils/Types'
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { BaseValidationModule } from './BaseValidationModule'

// Could be renamed with suffix API
export class ECDSAOwnershipValidationModule extends BaseValidationModule {
  signer: Signer
  moduleAddress!: string
  version: ModuleVersion = 'V1_0_0'

  constructor(moduleConfig: ECDSAOwnershipValidationModuleConfig) {
    super(moduleConfig)
    if (moduleConfig.moduleAddress) {
      this.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version]
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`)
      }
      this.moduleAddress = moduleAddr
      this.version = moduleConfig.version as ModuleVersion
    } else {
      this.moduleAddress = DEFAULT_ECDSA_OWNERSHIP_MODULE
      // <<Note>>: in this case Version remains the default one
    }
    this.signer = moduleConfig.signer
  }

  getAddress(): string {
    return this.moduleAddress
  }

  async getSigner(): Promise<Signer> {
    return await Promise.resolve(this.signer)
  }

  async getDummySignature(): Promise<string> {
    const moduleAddress = ethers.utils.getAddress(this.getAddress())
    const dynamicPart = moduleAddress.substring(2).padEnd(40, '0')
    return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
  }

  // <<Note>>: other modules may need additional attributes to build init data
  async getInitData(): Promise<string> {
    const ecdsaOwnerAddress = await this.signer.getAddress()
    const moduleRegistryAbi = 'function initForSmartAccount(address owner)'
    const ecdsaModuleRegistryInterface = new ethers.utils.Interface([moduleRegistryAbi])
    const ecdsaOwnershipInitData = ecdsaModuleRegistryInterface.encodeFunctionData(
      'initForSmartAccount',
      [ecdsaOwnerAddress]
    )
    return ecdsaOwnershipInitData
  }

  async signUserOpHash(userOpHash: string): Promise<string> {
    const sig = await this.signer.signMessage(arrayify(userOpHash))

    Logger.log('ecdsa signature ', sig)

    return sig
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this.signer.signMessage(message)
  }
}
