import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { SmartAccount } from './BaseAccount'
import {
  Logger,
  NODE_CLIENT_URL,
  RPC_PROVIDER_URLS,
  SmartAccountFactory_v100,
  getEntryPointContractInstance,
  getFactoryContractInstance,
  getProxyContractInstance
} from '@biconomy/common'
import { BiconomySmartAccountConfig, Overrides } from './utils/Types'
import { UserOperation, Transaction, SmartAccountType } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
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
import { ENTRYPOINT_ADDRESSES, BICONOMY_FACTORY_ADDRESSES, BICONOMY_IMPLEMENTATION_ADDRESSES } from './utils/Constants'

export class BiconomySmartAccount extends SmartAccount implements IBiconomySmartAccount {
  private factory!: SmartAccountFactory_v100
  private nodeClient: INodeClient
  private accountIndex!: number
  private address!: string
  private smartAccountInfo!: ISmartAccount
  private isInited!: boolean

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    const {
      signer,
      rpcUrl,
      entryPointAddress,
      factoryAddress,
      bundler,
      paymaster,
      chainId,
      nodeClientUrl
    } = biconomySmartAccountConfig

    const _entryPointAddress = entryPointAddress ?? ENTRYPOINT_ADDRESSES.default
    super({
      bundler,
      entryPointAddress: _entryPointAddress
    })
    const _rpcUrl = rpcUrl ?? RPC_PROVIDER_URLS[chainId]

    if (!_rpcUrl) {
      throw new Error(`Chain Id ${chainId} is not supported. Please refer to the following link for supported chains list https://docs.biconomy.io/build-with-biconomy-sdk/gasless-transactions#supported-chains`)
    }
    this.provider = new JsonRpcProvider(_rpcUrl)
    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL })
    this.signer = signer

    if (paymaster) {
      this.paymaster = paymaster
    }
    if (bundler)
      this.bundler = bundler
  }
  /**
   * @description This function will initialise BiconomyAccount class state
   * @returns Promise<BiconomyAccount>
   */
  async init(accountIndex: number = 0): Promise<BiconomySmartAccount> {
    try {
      this.isProviderDefined()
      this.isSignerDefined()
      this.owner = await this.signer.getAddress()
      this.chainId = await this.provider.getNetwork().then((net) => net.chainId)
      await this.setAccountIndex(accountIndex)
      this.isInited = true
    } catch (error) {
      Logger.error(`Failed to call init: ${error}`);
      throw error
    }

    return this
  }

  private isInitialized(): boolean{
    if (!this.isInited)
    throw new Error('BiconomySmartAccount is not initialized. Please call BiconomySmartAccount.init() before interacting with any other function')
    return true
  }

  private setProxyContractState(){
    const proxyInstanceDto = {
      smartAccountType: SmartAccountType.BICONOMY,
      version: BICONOMY_IMPLEMENTATION_ADDRESSES[this.address],
      contractAddress: this.address,
      provider: this.provider
    }
    this.proxy = getProxyContractInstance(proxyInstanceDto)
  }

  private setEntryPointContractState(){
    const _entryPointAddress = this.smartAccountInfo.entryPointAddress
    this.setEntrypointAddress(_entryPointAddress)
    const entryPointInstanceDto = {
      smartAccountType: SmartAccountType.BICONOMY,
      version: ENTRYPOINT_ADDRESSES[_entryPointAddress],
      contractAddress: _entryPointAddress,
      provider: this.provider
    }
    this.entryPoint = getEntryPointContractInstance(entryPointInstanceDto)
  }

  private setFactoryContractState(){
    const _factoryAddress = this.smartAccountInfo.factoryAddress
    const factoryInstanceDto = {
      smartAccountType: SmartAccountType.BICONOMY,
      version: BICONOMY_FACTORY_ADDRESSES[_factoryAddress],
      contractAddress: _factoryAddress,
      provider: this.provider
    }
    this.factory = getFactoryContractInstance(factoryInstanceDto)
  }

  private async setContractsState() {
    this.setProxyContractState()
    this.setEntryPointContractState()
    this.setFactoryContractState()
  }

  async setAccountIndex(accountIndex: number): Promise<void> {
    this.isInitialized()
    this.accountIndex = accountIndex
    this.address = await this.getSmartAccountAddress(accountIndex)
    await this.setContractsState()
    await this.setInitCode(this.accountIndex)
  }

  async getSmartAccountAddress(accountIndex: number = 0): Promise<string> {
    try {
      this.isSignerDefined()
      let smartAccountsList: ISmartAccount[] = (await this.getSmartAccountsByOwner({
        chainId: this.chainId,
        owner: this.owner
      })).data
      smartAccountsList = smartAccountsList.filter((smartAccount: ISmartAccount) => { return accountIndex === smartAccount.index })
      if (smartAccountsList.length === 0)
        throw new Error('Failed to get smart account address')
      this.smartAccountInfo = smartAccountsList[0]
      return this.smartAccountInfo.smartAccountAddress
    } catch (error) {
      Logger.error(`Failed to get smart account address: ${error}`);
      throw error
    }
  }

  private async setInitCode(accountIndex: number = 0): Promise<string> {
    this.initCode = ethers.utils.hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData('deployCounterFactualAccount', [
        await this.signer.getAddress(),
        ethers.BigNumber.from(accountIndex)
      ])
    ])
    return this.initCode
  }
  /**
   * @description an overrided function to showcase overriding example
   * @returns
   */
  nonce(): Promise<BigNumber> {
    this.isProxyDefined()
    return this.proxy.nonce()
  }
  /**
   *
   * @param to { target } address of transaction
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns
   */
  getExecuteCallData(to: string, value: BigNumberish, data: BytesLike): string {
    this.isInitialized()
    this.isProxyDefined()
    const executeCallData = this.proxy.interface.encodeFunctionData('executeCall', [to, value, data])
    return executeCallData
  }
  /**
   *
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns
   */
  getExecuteBatchCallData(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>): string {
    this.isInitialized()
    this.isProxyDefined()
    const executeBatchCallData = this.proxy.interface.encodeFunctionData('executeBatchCall', [to, value, data])
    return executeBatchCallData
  }

  async buildUserOp(transactions: Transaction[], overrides?: Overrides): Promise<Partial<UserOperation>> {
    this.isInitialized()
    // TODO: validate to, value and data fields
    // TODO: validate overrides if supplied
    const to = transactions.map((element: Transaction) => element.to)
    const data = transactions.map((element: Transaction) => element.data ?? '0x')
    const value = transactions.map((element: Transaction) => element.value ?? BigNumber.from('0'))
    this.isProxyDefined()

    let callData = ''
    if (transactions.length === 1) {
      callData = this.getExecuteCallData(to[0], value[0], data[0])
    } else {
      callData = this.getExecuteBatchCallData(to, value, data)
    }

    let nonce = BigNumber.from(0)
    try {
      nonce = await this.nonce()
    } catch (error) {
      // Not throwing this error as nonce would be 0 if this.nonce() throw exception, which is expected flow for undeployed account
    }

    let userOp: Partial<UserOperation> = {
      sender: this.address,
      nonce,
      initCode: nonce.eq(0) ? this.initCode : '0x',
      callData: callData
    }

    userOp = await this.estimateUserOpGas(userOp, overrides)
    Logger.log('userOp after estimation ', userOp)
    userOp.paymasterAndData = await this.getPaymasterAndData(userOp)
    return userOp
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
