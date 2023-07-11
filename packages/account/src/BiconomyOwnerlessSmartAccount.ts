import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { SmartAccount } from './SmartAccount'
import {
  Logger,
  NODE_CLIENT_URL,
  RPC_PROVIDER_URLS,
  getEntryPointContract,
  getSAFactoryContract,
  getSAProxyContract
} from '@biconomy/common'
import {
  BiconomySmartAccountConfig,
  Overrides,
  BiconomyTokenPaymasterRequest,
  InitilizationData
} from './utils/Types'
import { UserOperation, Transaction, SmartAccountType } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { IHybridPaymaster, BiconomyPaymaster, SponsorUserOperationDto } from '@biconomy/paymaster'
import { IBiconomySmartAccount } from 'interfaces/IBiconomySmartAccount'
import {
  ISmartAccount,
  SupportedChainsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  SmartAccountByOwnerDto,
  SmartAccountsResponse,
  SCWTransactionResponse
} from '@biconomy/node-client'
import {
  ENTRYPOINT_ADDRESSES,
  BICONOMY_FACTORY_ADDRESSES,
  BICONOMY_IMPLEMENTATION_ADDRESSES,
  DEFAULT_ENTRYPOINT_ADDRESS
} from './utils/Constants'
import { BiconomySmartAccount } from './BiconomySmartAccount'

export class BiconomyOwnerlessSmartAccount
  extends BiconomySmartAccount
  implements IBiconomySmartAccount
{
  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    super(biconomySmartAccountConfig)
  }

  async signUserOp(userOp: Partial<UserOperation>): Promise<UserOperation> {
    userOp = await super.signUserOp(userOp)
    let signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
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
