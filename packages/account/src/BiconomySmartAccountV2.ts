import { ethers } from 'ethers'
import { BiconomySmartAccountConfig } from './utils/Types'
import { UserOperation } from '@biconomy/core-types'
import { IBiconomySmartAccount } from 'interfaces/IBiconomySmartAccount'
import { BiconomySmartAccount } from './BiconomySmartAccountV1'

export class BiconomyOwnerlessSmartAccount
  extends BiconomySmartAccount
  implements IBiconomySmartAccount
{
  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    super(biconomySmartAccountConfig)
  }

  async signUserOp(userOp: Partial<UserOperation>): Promise<UserOperation> {
    userOp = await super.signUserOp(userOp)
    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'address'],
      [userOp.signature, this.getSmartAccountInfo().ecdsaModuleAddress]
    )
    userOp.signature = signatureWithModuleAddress
    return userOp as UserOperation
  }

  protected async setInitCode(accountIndex = 0): Promise<string> {
    const factoryInstance = this.getFactoryInstance()
    const ecdsaModuleRegistryAbi = 'function initForSmartAccount(address owner)'
    const ecdsaModuleRegistryInterface = new ethers.utils.Interface([ecdsaModuleRegistryAbi])
    const ecdsaOwnershipInitData = ecdsaModuleRegistryInterface.encodeFunctionData(
      'initForSmartAccount',
      [this.owner]
    )
    this.initCode = ethers.utils.hexConcat([
      factoryInstance.address,
      factoryInstance.interface.encodeFunctionData('deployCounterFactualAccount', [
        this.getSmartAccountInfo().ecdsaModuleAddress,
        ecdsaOwnershipInitData,
        accountIndex
      ])
    ])
    return this.initCode
  }
}
