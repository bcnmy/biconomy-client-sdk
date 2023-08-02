import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { SmartAccount } from './SmartAccount'
import {
  Logger,
  NODE_CLIENT_URL,
  RPC_PROVIDER_URLS,
  SmartAccountFactory_v100,
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
import { Signer } from 'ethers'

export class BiconomySmartAccount extends SmartAccount implements IBiconomySmartAccount {
  private factory!: SmartAccountFactory_v100
  private nodeClient: INodeClient
  private accountIndex!: number
  private address!: string
  private smartAccountInfo!: ISmartAccount
  private _isInitialised!: boolean

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    const { signer, rpcUrl, entryPointAddress, bundler, paymaster, chainId, nodeClientUrl } =
      biconomySmartAccountConfig

    const _entryPointAddress = entryPointAddress ?? DEFAULT_ENTRYPOINT_ADDRESS
    super({
      bundler,
      entryPointAddress: _entryPointAddress
    })
    const _rpcUrl = rpcUrl ?? RPC_PROVIDER_URLS[chainId]

    if (!_rpcUrl) {
      throw new Error(
        `Chain Id ${chainId} is not supported. Please refer to the following link for supported chains list https://docs.biconomy.io/build-with-biconomy-sdk/gasless-transactions#supported-chains`
      )
    }
    this.provider = new JsonRpcProvider(_rpcUrl)
    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL })
    this.signer = signer

    if (paymaster) {
      this.paymaster = paymaster
    }
    if (bundler) this.bundler = bundler
  }
  /**
   * @description This function will initialise BiconomyAccount class state
   * @returns Promise<BiconomyAccount>
   */
  async init(initilizationData?: InitilizationData): Promise<this> {
    try {
      let _accountIndex, signerAddress
      if (initilizationData) {
        _accountIndex = initilizationData.accountIndex
        signerAddress = initilizationData.signerAddress
      }

      if (!_accountIndex) _accountIndex = 0
      this.isProviderDefined()
      this.isSignerDefined()

      if (signerAddress) {
        this.owner = signerAddress
      } else {
        this.owner = await this.signer.getAddress()
      }
      this.chainId = await this.provider.getNetwork().then((net) => net.chainId)
      await this.initializeAccountAtIndex(_accountIndex)
      this._isInitialised = true
    } catch (error) {
      Logger.error(`Failed to call init: ${error}`)
      throw error
    }

    return this
  }

  async attachSigner(_signer: Signer): Promise<void> {
    try {
      this.signer = _signer
      this.owner = await this.signer.getAddress()
    } catch (error) {
      throw new Error(`Failed to get signer address`)
    }
  }

  private isInitialized(): boolean {
    if (!this._isInitialised)
      throw new Error(
        'BiconomySmartAccount is not initialized. Please call init() on BiconomySmartAccount instance before interacting with any other function'
      )
    return true
  }

  private setProxyContractState() {
    if (!BICONOMY_IMPLEMENTATION_ADDRESSES[this.smartAccountInfo.implementationAddress])
      throw new Error(
        'Could not find attached implementation address against your smart account. Please raise an issue on https://github.com/bcnmy/biconomy-client-sdk for further investigation.'
      )
    const proxyInstanceDto = {
      smartAccountType: SmartAccountType.BICONOMY,
      version: BICONOMY_IMPLEMENTATION_ADDRESSES[this.address],
      contractAddress: this.address,
      provider: this.provider
    }
    this.proxy = getSAProxyContract(proxyInstanceDto)
  }

  private setEntryPointContractState() {
    const _entryPointAddress = this.smartAccountInfo.entryPointAddress
    this.setEntryPointAddress(_entryPointAddress)
    if (!ENTRYPOINT_ADDRESSES[_entryPointAddress])
      throw new Error(
        'Could not find attached entrypoint address against your smart account. Please raise an issue on https://github.com/bcnmy/biconomy-client-sdk for further investigation.'
      )
    const entryPointInstanceDto = {
      smartAccountType: SmartAccountType.BICONOMY,
      version: ENTRYPOINT_ADDRESSES[_entryPointAddress],
      contractAddress: _entryPointAddress,
      provider: this.provider
    }
    this.entryPoint = getEntryPointContract(entryPointInstanceDto)
  }

  private setFactoryContractState() {
    const _factoryAddress = this.smartAccountInfo.factoryAddress
    if (!BICONOMY_FACTORY_ADDRESSES[_factoryAddress])
      throw new Error(
        'Could not find attached factory address against your smart account. Please raise an issue on https://github.com/bcnmy/biconomy-client-sdk for further investigation.'
      )
    const factoryInstanceDto = {
      smartAccountType: SmartAccountType.BICONOMY,
      version: BICONOMY_FACTORY_ADDRESSES[_factoryAddress],
      contractAddress: _factoryAddress,
      provider: this.provider
    }
    this.factory = getSAFactoryContract(factoryInstanceDto)
  }

  private async setContractsState() {
    this.setProxyContractState()
    this.setEntryPointContractState()
    this.setFactoryContractState()
  }

  async initializeAccountAtIndex(accountIndex: number): Promise<void> {
    this.accountIndex = accountIndex
    this.address = await this.getSmartAccountAddress(accountIndex)
    await this.setContractsState()
    await this.setInitCode(this.accountIndex)
  }

  async getSmartAccountAddress(accountIndex = 0): Promise<string> {
    try {
      this.isSignerDefined()
      let smartAccountsList: ISmartAccount[] = (
        await this.getSmartAccountsByOwner({
          chainId: this.chainId,
          owner: this.owner,
          index: accountIndex
        })
      ).data
      if (!smartAccountsList)
        throw new Error(
          'Failed to get smart account address. Please raise an issue on https://github.com/bcnmy/biconomy-client-sdk for further investigation.'
        )
      smartAccountsList = smartAccountsList.filter((smartAccount: ISmartAccount) => {
        return accountIndex === smartAccount.index
      })
      if (smartAccountsList.length === 0)
        throw new Error(
          'Failed to get smart account address. Please raise an issue on https://github.com/bcnmy/biconomy-client-sdk for further investigation.'
        )
      this.smartAccountInfo = smartAccountsList[0]
      return this.smartAccountInfo.smartAccountAddress
    } catch (error) {
      Logger.error(`Failed to get smart account address: ${error}`)
      throw error
    }
  }

  private async setInitCode(accountIndex = 0): Promise<string> {
    this.initCode = ethers.utils.hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData('deployCounterFactualAccount', [
        this.owner,
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
    const executeCallData = this.proxy.interface.encodeFunctionData('executeCall', [
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
  getExecuteBatchCallData(
    to: Array<string>,
    value: Array<BigNumberish>,
    data: Array<BytesLike>
  ): string {
    this.isInitialized()
    this.isProxyDefined()
    const executeBatchCallData = this.proxy.interface.encodeFunctionData('executeBatchCall', [
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

  async buildUserOp(
    transactions: Transaction[],
    overrides?: Overrides,
    skipBundlerGasEstimation?: boolean
  ): Promise<Partial<UserOperation>> {
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
    let isDeployed = true

    if (nonce.eq(0)) {
      isDeployed = await this.isAccountDeployed(this.address)
    }

    let userOp: Partial<UserOperation> = {
      sender: this.address,
      nonce,
      initCode: !isDeployed ? this.initCode : '0x',
      callData: callData
    }

    // for this Smart Account dummy ECDSA signature will be used to estimate gas
    userOp.signature = this.getDummySignature()

    userOp = await this.estimateUserOpGas(userOp, overrides, skipBundlerGasEstimation)
    Logger.log('userOp after estimation ', userOp)

    // Do not populate paymasterAndData as part of buildUserOp as it may not have all necessary details
    userOp.paymasterAndData = '0x' // await this.getPaymasterAndData(userOp)

    return userOp
  }

  private validateUserOpAndRequest(
    userOp: Partial<UserOperation>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest
  ): void {
    if (!userOp.callData) {
      throw new Error('Userop callData cannot be undefined')
    }

    const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress
    Logger.log('requested fee token is ', feeTokenAddress)

    if (!feeTokenAddress || feeTokenAddress == ethers.constants.AddressZero) {
      throw new Error(
        'Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest'
      )
    }

    const spender = tokenPaymasterRequest?.spender
    Logger.log('fee token approval to be checked and added for spender: ', spender)

    if (!spender || spender == ethers.constants.AddressZero) {
      throw new Error(
        'Invalid or missing spender address. Sepnder address must be part of tokenPaymasterRequest'
      )
    }
  }

  /**
   *
   * @param userOp partial user operation without signature and paymasterAndData
   * @param tokenPaymasterRequest This dto provides information about fee quote. Fee quote is received from earlier request getFeeQuotesOrData() to the Biconomy paymaster.
   *  maxFee and token decimals from the quote, along with the spender is required to append approval transaction.
   * @notice This method should be called when gas is paid in ERC20 token using TokenPaymaster
   * @description Optional method to update the userOp.calldata with batched transaction which approves the paymaster spender with necessary amount(if required)
   * @returns updated userOp with new callData, callGasLimit
   */
  async buildTokenPaymasterUserOp(
    userOp: Partial<UserOperation>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest
  ): Promise<Partial<UserOperation>> {
    this.validateUserOpAndRequest(userOp, tokenPaymasterRequest)
    try {
      let batchTo: Array<string> = []
      let batchValue: Array<string | BigNumberish> = []
      let batchData: Array<string> = []

      let newCallData = userOp.callData
      Logger.log('received information about fee token address and quote ', tokenPaymasterRequest)

      if (this.paymaster && this.paymaster instanceof BiconomyPaymaster) {
        // Make a call to paymaster.buildTokenApprovalTransaction() with necessary details

        // Review: might request this form of an array of Transaction
        const approvalRequest: Transaction = await (
          this.paymaster as IHybridPaymaster<SponsorUserOperationDto>
        ).buildTokenApprovalTransaction(tokenPaymasterRequest, this.provider)
        Logger.log('approvalRequest is for erc20 token ', approvalRequest.to)

        if (approvalRequest.data == '0x' || approvalRequest.to == ethers.constants.AddressZero) {
          return userOp
        }

        if (!userOp.callData) {
          throw new Error('Userop callData cannot be undefined')
        }

        const decodedDataSmartWallet = this.proxy.interface.parseTransaction({
          data: userOp.callData.toString()
        })
        if (!decodedDataSmartWallet) {
          throw new Error('Could not parse call data of smart wallet for userOp')
        }

        const smartWalletExecFunctionName = decodedDataSmartWallet.name

        if (smartWalletExecFunctionName === 'executeCall') {
          Logger.log('originally an executeCall for Biconomy Account')
          const methodArgsSmartWalletExecuteCall = decodedDataSmartWallet.args
          const toOriginal = methodArgsSmartWalletExecuteCall[0]
          const valueOriginal = methodArgsSmartWalletExecuteCall[1]
          const dataOriginal = methodArgsSmartWalletExecuteCall[2]

          batchTo.push(toOriginal)
          batchValue.push(valueOriginal)
          batchData.push(dataOriginal)
        } else if (smartWalletExecFunctionName === 'executeBatchCall') {
          Logger.log('originally an executeBatchCall for Biconomy Account')
          const methodArgsSmartWalletExecuteCall = decodedDataSmartWallet.args
          batchTo = methodArgsSmartWalletExecuteCall[0]
          batchValue = methodArgsSmartWalletExecuteCall[1]
          batchData = methodArgsSmartWalletExecuteCall[2]
        }

        if (approvalRequest.to && approvalRequest.data && approvalRequest.value) {
          batchTo = [approvalRequest.to, ...batchTo]
          batchValue = [approvalRequest.value, ...batchValue]
          batchData = [approvalRequest.data, ...batchData]

          newCallData = this.getExecuteBatchCallData(batchTo, batchValue, batchData)
        }
        let finalUserOp: Partial<UserOperation> = {
          ...userOp,
          callData: newCallData
        }

        // Requesting to update gas limits again (especially callGasLimit needs to be re-calculated)
        try {
          finalUserOp = await this.estimateUserOpGas(finalUserOp)
          const cgl = ethers.BigNumber.from(finalUserOp.callGasLimit)
          if (finalUserOp.callGasLimit && cgl.lt(ethers.BigNumber.from('21000'))) {
            return {
              ...userOp,
              callData: newCallData
            }
          }
          Logger.log('userOp after estimation ', finalUserOp)
        } catch (error) {
          Logger.error('Failed to estimate gas for userOp with updated callData ', error)
          Logger.log(
            'sending updated userOp. calculateGasLimit flag should be sent to the paymaster to be able to update callGasLimit'
          )
        }
        return finalUserOp
      }
    } catch (error) {
      Logger.log('Failed to update userOp. sending back original op')
      Logger.error('Failed to update callData with error', error)
      return userOp
    }
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
