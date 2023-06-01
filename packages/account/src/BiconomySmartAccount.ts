import { JsonRpcProvider, Web3Provider, Provider } from '@ethersproject/providers'
import { Signer, ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { SmartAccount } from './BaseAccount'
import { BiconomyPaymasterAPI } from '@biconomy/paymaster'
import {
  NODE_CLIENT_URL,
  EntryPoint_v100__factory,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100__factory
} from '@biconomy/common'
import { BiconomySmartAccountConfig, Overrides } from './utils/Types'
import { UserOperation, Transaction } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { IBiconomySmartAccount } from 'interfaces/IBiconomySmartAccount'
import { Bundler } from '@biconomy/bundler'
import {
  SupportedChainsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  SmartAccountByOwnerDto,
  SmartAccountsResponse,
  SCWTransactionResponse
} from '@biconomy/node-client'
import { epAddresses, factoryAddresses } from './utils/Constants'

export class BiconomySmartAccount extends SmartAccount implements IBiconomySmartAccount {
  private factory: SmartAccountFactory_v100
  private nodeClient: INodeClient
  private accountIndex!: Number

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    const {
      signer,
      rpcUrl,
      epAddress,
      factoryAddress,
      bundlerUrl,
      paymasterUrl,
      nodeClientUrl,
      dappApiKey,
      userOpReceiptIntervals
    } = biconomySmartAccountConfig

    const _epAddress = epAddress ?? epAddresses.default
    const _factoryAddress = factoryAddress ?? factoryAddresses.default
    const _dappApiKey = dappApiKey ?? ''

    super({
      bundlerUrl,
      epAddress: _epAddress
    })
    if (bundlerUrl)
      this.bundler = new Bundler({
        bundlerUrl,
        epAddress: _epAddress,
        dappApiKey: _dappApiKey,
        userOpReceiptIntervals
      })
    this.provider = new JsonRpcProvider(rpcUrl)
    this.entryPoint = EntryPoint_v100__factory.connect(_epAddress, this.provider)
    this.factory = SmartAccountFactory_v100__factory.connect(_factoryAddress, this.provider)
    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL })
    this.signer = signer

    if (paymasterUrl) this.paymaster = new BiconomyPaymasterAPI(paymasterUrl)
  }
  /**
   * @description This function will initialise BiconomyAccount class state
   * @returns Promise<BiconomyAccount>
   */
  async init(accountIndex: number = 0): Promise<BiconomySmartAccount> {
    try {
      this.isProviderDefined()
      this.isSignerDefined()
      this.setAccountIndex(accountIndex)
      this.chainId = await this.provider.getNetwork().then((net) => net.chainId)
      await this.getInitCode(accountIndex)
      const address = await this.getSmartAccountAddress(accountIndex)
      this.proxy = await SmartAccount_v100__factory.connect(address, this.provider)
    } catch (error) {
      console.error(`Failed to call init: ${error}`);
      throw error
    }

    return this
  }

  setAccountIndex(accountIndex: number): void {
    this.accountIndex = accountIndex
  }

  async getSmartAccountAddress(accountIndex: number = 0): Promise<string> {
    try {
      this.isSignerDefined()
      this.getInitCode(accountIndex)
      const address = await this.factory.getAddressForCounterFactualAccount(
        await this.signer.getAddress(),
        ethers.BigNumber.from(accountIndex)
      )
      return address
    } catch (error: any) {
      throw Error(error)
    }
  }

  async getInitCode(accountIndex: number = 0): Promise<string> {
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
    this.isProxyDefined()
    const executeBatchCallData = this.proxy.interface.encodeFunctionData('executeBatchCall', [to, value, data])
    return executeBatchCallData
  }

  async buildUserOp(transactions: Transaction[], overrides?: Overrides): Promise<Partial<UserOperation>> {
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

    const nonce = await this.nonce()
    let userOp: Partial<UserOperation> = {
      sender: await this.getSmartAccountAddress(),
      nonce,
      initCode: nonce.eq(0) ? await this.getInitCode() : '0x',
      callData: callData
    }    

    userOp = await this.estimateUserOpGas(userOp, overrides),
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