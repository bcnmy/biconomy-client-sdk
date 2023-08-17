import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { BaseSmartAccount } from './BaseSmartAccount'
import { keccak256, Bytes, arrayify, hexConcat } from 'ethers/lib/utils'
import {
  Logger,
  NODE_CLIENT_URL,
  RPC_PROVIDER_URLS,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100,
  SmartAccount_v100__factory,
  getEntryPointContract,
  getSAFactoryContract,
  getSAProxyContract
} from '@biconomy/common'
import {
  BiconomySmartAccountConfig,
  Overrides,
  BiconomyTokenPaymasterRequest,
  InitilizationData,
  BiconomySmartAccountV2Config
} from './utils/Types'
import { UserOperation, Transaction, SmartAccountType } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { IHybridPaymaster, BiconomyPaymaster, SponsorUserOperationDto } from '@biconomy/paymaster'
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
import { Signer } from 'ethers'

export class BiconomySmartAccountV2 extends BaseSmartAccount {
  private nodeClient: INodeClient

  // private smartAccountInfo!: ISmartAccount
  private _isInitialised!: boolean

  factoryAddress?: string

  /**
   * our account contract.
   * should support the "execFromEntryPoint" and "nonce" methods
   */
  accountContract?: any // for now

  // TODO: both should be V2

  factory?: any // SmartAccountFactory_v100

  defaultValidationModule: any // for now // BaseValidationModule
  activeValidationModule: any // for now // BaseValidationModule

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountV2Config) {
    super(biconomySmartAccountConfig)
    this.factoryAddress = biconomySmartAccountConfig.factoryAddress
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.activeValidationModule = biconomySmartAccountConfig.activeValidationModule!

    const { rpcUrl, nodeClientUrl } = biconomySmartAccountConfig

    if (rpcUrl) {
      this.provider = new JsonRpcProvider(rpcUrl)
    }

    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL })
  }

  async _getAccountContract(): Promise<SmartAccount_v100> {
    if (this.accountContract == null) {
      this.accountContract = SmartAccountFactory_v100__factory.connect(
        await this.getAccountAddress(),
        this.provider
      )
    }
    return this.accountContract
  }

  // TODO
  async getNonce(): Promise<BigNumber> {
    if (await this.isAccountDeployed(await this.getAccountAddress())) {
      const accountContract = await this._getAccountContract()
      return await accountContract.getNonce(0)
    }
    return BigNumber.from(0)
  }

  /**
   * return the value to put into the "initCode" field, if the account is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== '') {
        this.factory = SmartAccount_v100__factory.connect(this.factoryAddress, this.provider)
      } else {
        throw new Error('no factory to get initCode')
      }
    }
    return hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData('deployCounterFactualAccount', [
        ethers.constants.AddressZero,
        ethers.BigNumber.from(this.index)
      ])
    ])
  }

  /**
   *
   * @param to { target } address of transaction
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns
   */
  async encodeExecute(to: string, value: BigNumberish, data: BytesLike): Promise<string> {
    // this.isInitialized()
    // this.isProxyDefined()
    const accountContract = await this._getAccountContract()
    const executeCallData = accountContract.interface.encodeFunctionData('executeCall', [
      to,
      value,
      data
    ])
    return executeCallData
  }
  /**
   *
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns
   */
  async encodeExecuteBatch(
    to: Array<string>,
    value: Array<BigNumberish>,
    data: Array<BytesLike>
  ): Promise<string> {
    // this.isInitialized()
    // this.isProxyDefined()
    const accountContract = await this._getAccountContract()
    const executeBatchCallData = accountContract.interface.encodeFunctionData('executeBatchCall', [
      to,
      value,
      data
    ])
    return executeBatchCallData
  }

  getDummySignature(): string {
    return '0x73c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b'
  }

  getDummyPaymasterData(): string {
    return '0x'
  }

  // TODO
  async signUserOpHash(userOpHash: string): Promise<string> {
    Logger.log('userOpHash ', userOpHash)
    return '0x'
  }

  // TODO
  async signMessage(message: Bytes | string): Promise<string> {
    Logger.log('message ', message.toString())
    return '0x'
  }

  async getAllTokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse> {
    return this.nodeClient.getAllTokenBalances(balancesDto)
  }

  async getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse> {
    return this.nodeClient.getTotalBalanceInUsd(balancesDto)
  }

  async getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse> {
    return this.nodeClient.getSmartAccountsByOwner(smartAccountByOwnerDto)
  }

  async getTransactionsByAddress(
    chainId: number,
    address: string
  ): Promise<SCWTransactionResponse[]> {
    return this.nodeClient.getTransactionByAddress(chainId, address)
  }

  async getTransactionByHash(txHash: string): Promise<SCWTransactionResponse> {
    return this.nodeClient.getTransactionByHash(txHash)
  }

  async getAllSupportedChains(): Promise<SupportedChainsResponse> {
    return this.nodeClient.getAllSupportedChains()
  }
}
