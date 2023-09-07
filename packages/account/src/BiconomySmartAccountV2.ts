import { JsonRpcProvider } from '@ethersproject/providers'
import { Signer } from 'ethers'
import { ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { BaseSmartAccount } from './BaseSmartAccount'
import { keccak256, Bytes, arrayify, hexConcat } from 'ethers/lib/utils'
import { Logger, NODE_CLIENT_URL, RPC_PROVIDER_URLS } from '@biconomy/common'

// <<review>> failure reason for import from '@biconomy/account-contracts-v2/typechain'

import {
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory
} from '@biconomy/common'

import {
  Overrides,
  BiconomyTokenPaymasterRequest,
  BiconomySmartAccountV2Config,
  CounterFactualAddressParam,
  BuildUserOpOptions
} from './utils/Types'
import { BaseValidationModule, ModuleInfo } from '@biconomy/modules'
import { UserOperation, Transaction, SmartAccountType } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { IHybridPaymaster, BiconomyPaymaster, SponsorUserOperationDto } from '@biconomy/paymaster'
import {
  SupportedChainsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  SmartAccountByOwnerDto,
  SmartAccountsResponse,
  SCWTransactionResponse
} from '@biconomy/node-client'
import { UserOpResponse } from '@biconomy/bundler'
import { DEFAULT_BICONOMY_FACTORY_ADDRESS } from './utils/Constants'

type UserOperationKey = keyof UserOperation
export class BiconomySmartAccountV2 extends BaseSmartAccount {
  private nodeClient: INodeClient

  // <<review>>: Marked for deletion
  // private smartAccountInfo!: ISmartAccount
  // private _isInitialised!: boolean

  factoryAddress?: string

  /**
   * our account contract.
   * should support the "execFromEntryPoint" and "nonce" methods
   */
  accountContract?: SmartAccount_v200

  // <<TODO>>: both should be V2

  factory?: SmartAccountFactory_v200

  // Validation module responsible for account deployment initCode. This acts as a default authorization module.
  defaultValidationModule: BaseValidationModule
  // Deployed Smart Account can have more than one module enabled. When sending a transaction activeValidationModule is used to prepare and validate userOp signature.
  activeValidationModule: BaseValidationModule

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountV2Config) {
    super(biconomySmartAccountConfig)
    // <<review>>: if it's really needed to supply factory address
    this.factoryAddress =
      biconomySmartAccountConfig.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS // This would be fetched from V2
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.activeValidationModule =
      biconomySmartAccountConfig.activeValidationModule ?? this.defaultValidationModule

    const { rpcUrl, nodeClientUrl } = biconomySmartAccountConfig

    if (rpcUrl) {
      this.provider = new JsonRpcProvider(rpcUrl)
    }

    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL })
  }

  async _getAccountContract(): Promise<SmartAccount_v200> {
    if (this.accountContract == null) {
      this.accountContract = SmartAccount_v200__factory.connect(
        await this.getAccountAddress(),
        this.provider
      )
    }
    return this.accountContract
  }

  isActiveValidationModuleDefined(): boolean {
    if (!this.activeValidationModule)
      throw new Error('Must provide an instance of active validation module.')
    return true
  }

  isDefaultValidationModuleDefined(): boolean {
    if (!this.defaultValidationModule)
      throw new Error('Must provide an instance of default validation module.')
    return true
  }

  setActiveValidationModule(validationModule: BaseValidationModule): BiconomySmartAccountV2 {
    if (validationModule instanceof BaseValidationModule) {
      this.activeValidationModule = validationModule
    }
    return this
  }

  setDefaultValidationModule(validationModule: BaseValidationModule): BiconomySmartAccountV2 {
    if (validationModule instanceof BaseValidationModule) {
      this.defaultValidationModule = validationModule
    }
    return this
  }

  async getNonce(): Promise<BigNumber> {
    if (await this.isAccountDeployed(await this.getAccountAddress())) {
      const accountContract = await this._getAccountContract()
      return await accountContract.nonce()
    }
    return BigNumber.from(0)
  }

  // <<review>>
  // Overridden this method because entryPoint.callStatic.getSenderAddress() based on initCode doesnt always work
  // in case of account is deployed you would get AA13 or AA10

  /**
   * calculate the account address even before it is deployed
   */
  async getCounterFactualAddress(params?: CounterFactualAddressParam): Promise<string> {
    // use Factory method instead

    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== '') {
        this.factory = SmartAccountFactory_v200__factory.connect(this.factoryAddress, this.provider)
      } else {
        throw new Error('no factory to get initCode')
      }
    }

    const _defaultAuthModule = params?.validationModule ?? this.defaultValidationModule
    const _index = params?.index ?? this.index

    const counterFactualAddress = await this.factory.getAddressForCounterFactualAccount(
      await _defaultAuthModule.getAddress(),
      await _defaultAuthModule.getInitData(),
      _index
    )

    return counterFactualAddress
  }

  /**
   * return the value to put into the "initCode" field, if the account is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== '') {
        this.factory = SmartAccountFactory_v200__factory.connect(this.factoryAddress, this.provider)
      } else {
        throw new Error('no factory to get initCode')
      }
    }

    this.isDefaultValidationModuleDefined()

    const populatedTransaction = await this.factory.populateTransaction.deployCounterFactualAccount(
      await this.defaultValidationModule.getAddress(),
      await this.defaultValidationModule.getInitData(),
      this.index
    )

    // <<TODO>>: interface should work.
    return hexConcat([
      this.factory.address,
      populatedTransaction.data as string
      /*this.factory.interface.encodeFunctionData('deployCounterFactualAccount', [
        await this.defaultValidationModule.getAddress(),
        await this.defaultValidationModule.getInitData(),
        this.index
      ])*/
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

    const populatedTransaction = await accountContract.populateTransaction.execute_ncC(
      to,
      value,
      data
    )

    /*const executeCallData = accountContract.interface.encodeFunctionData('execute_ncC', [
      to,
      value,
      data
    ])*/

    return populatedTransaction.data as string
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
    const populatedTransaction = await accountContract.populateTransaction.executeBatch_y6U(
      to,
      value,
      data
    )
    /*const executeBatchCallData = accountContract.interface.encodeFunctionData('executeBatch_y6U', [
      to,
      value,
      data
    ])*/
    return populatedTransaction.data as string
  }

  // dummy signature depends on the validation module supplied.
  async getDummySignature(params?: ModuleInfo): Promise<string> {
    this.isActiveValidationModuleDefined()
    return await this.activeValidationModule.getDummySignature(params)
  }

  // <<review>>:
  // Might use provided paymaster instance to get dummy data (from pm service)
  getDummyPaymasterData(): string {
    return '0x'
  }

  async signUserOp(userOp: Partial<UserOperation>, params?: ModuleInfo): Promise<UserOperation> {
    this.isActiveValidationModuleDefined()
    const requiredFields: UserOperationKey[] = [
      'sender',
      'nonce',
      'initCode',
      'callData',
      'callGasLimit',
      'verificationGasLimit',
      'preVerificationGas',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'paymasterAndData'
    ]
    super.validateUserOp(userOp, requiredFields)
    const userOpHash = await this.getUserOpHash(userOp)

    const moduleSig = await this.activeValidationModule.signUserOpHash(userOpHash, params)

    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'address'],
      [moduleSig, this.activeValidationModule.getAddress()]
    )

    userOp.signature = signatureWithModuleAddress
    return userOp as UserOperation
  }

  /**
   *
   * @param userOp
   * @param params
   * @description This function call will take 'unsignedUserOp' as an input, sign it with the owner key, and send it to the bundler.
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: Partial<UserOperation>, params?: ModuleInfo): Promise<UserOpResponse> {
    Logger.log('userOp received in base account ', userOp)
    delete userOp.signature
    const userOperation = await this.signUserOp(userOp, params)
    const bundlerResponse = await this.sendSignedUserOp(userOperation)
    return bundlerResponse
  }

  async buildUserOp(
    transactions: Transaction[],
    buildUseropDto?: BuildUserOpOptions
  ): Promise<Partial<UserOperation>> {
    // <<review>>: may not need at all
    // this.isInitialized()

    // <<TODO>>: validate to, value and data fields
    // <<TODO>>: validate overrides if supplied
    const to = transactions.map((element: Transaction) => element.to)
    const data = transactions.map((element: Transaction) => element.data ?? '0x')
    const value = transactions.map((element: Transaction) => element.value ?? BigNumber.from('0'))

    let callData = ''
    if (transactions.length === 1) {
      callData = await this.encodeExecute(to[0], value[0], data[0])
    } else {
      callData = await this.encodeExecuteBatch(to, value, data)
    }
    let nonce = BigNumber.from(0)
    try {
      nonce = await this.getNonce()
    } catch (error) {
      // Not throwing this error as nonce would be 0 if this.getNonce() throw exception, which is expected flow for undeployed account
    }

    // let isDeployed = false

    /*if (nonce.eq(0) && this.accountAddress) {
      isDeployed = await this.isAccountDeployed(this.accountAddress)
    }*/

    let userOp: Partial<UserOperation> = {
      sender: this.accountAddress,
      nonce,
      initCode: await this.getInitCode(),
      callData: callData
    }

    // for this Smart Account current validation module dummy signature will be used to estimate gas
    userOp.signature = await this.getDummySignature(buildUseropDto?.params)

    userOp = await this.estimateUserOpGas(
      userOp,
      buildUseropDto?.overrides,
      buildUseropDto?.skipBundlerGasEstimation
    )
    Logger.log('UserOp after estimation ', userOp)

    // Do not populate paymasterAndData as part of buildUserOp as it may not have all necessary details
    userOp.paymasterAndData = '0x' // await this.getPaymasterAndData(userOp)

    return userOp
  }

  private validateUserOpAndPaymasterRequest(
    userOp: Partial<UserOperation>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest
  ): void {
    if (!userOp.callData) {
      throw new Error('UserOp callData cannot be undefined')
    }

    const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress
    Logger.log('Requested fee token is ', feeTokenAddress)

    if (!feeTokenAddress || feeTokenAddress == ethers.constants.AddressZero) {
      throw new Error(
        'Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest'
      )
    }

    const spender = tokenPaymasterRequest?.spender
    Logger.log('Spender address is ', spender)

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
    this.validateUserOpAndPaymasterRequest(userOp, tokenPaymasterRequest)
    try {
      let batchTo: Array<string> = []
      let batchValue: Array<string | BigNumberish> = []
      let batchData: Array<string> = []

      let newCallData = userOp.callData
      Logger.log('Received information about fee token address and quote ', tokenPaymasterRequest)

      if (this.paymaster && this.paymaster instanceof BiconomyPaymaster) {
        // Make a call to paymaster.buildTokenApprovalTransaction() with necessary details

        // <<review>>: might request this form of an array of Transaction
        const approvalRequest: Transaction = await (
          this.paymaster as IHybridPaymaster<SponsorUserOperationDto>
        ).buildTokenApprovalTransaction(tokenPaymasterRequest, this.provider)
        Logger.log('ApprovalRequest is for erc20 token ', approvalRequest.to)

        if (approvalRequest.data == '0x' || approvalRequest.to == ethers.constants.AddressZero) {
          return userOp
        }

        if (!userOp.callData) {
          throw new Error('UserOp callData cannot be undefined')
        }

        const account = await this._getAccountContract()

        const decodedSmartAccountData = account.interface.parseTransaction({
          data: userOp.callData.toString()
        })
        if (!decodedSmartAccountData) {
          throw new Error('Could not parse userOp call data for this smart account')
        }

        const smartAccountExecFunctionName = decodedSmartAccountData.name

        Logger.log(
          `Originally an ${smartAccountExecFunctionName} method call for Biconomy Account V2`
        )
        if (
          smartAccountExecFunctionName === 'execute' ||
          smartAccountExecFunctionName === 'execute_ncC'
        ) {
          const methodArgsSmartWalletExecuteCall = decodedSmartAccountData.args
          const toOriginal = methodArgsSmartWalletExecuteCall[0]
          const valueOriginal = methodArgsSmartWalletExecuteCall[1]
          const dataOriginal = methodArgsSmartWalletExecuteCall[2]

          batchTo.push(toOriginal)
          batchValue.push(valueOriginal)
          batchData.push(dataOriginal)
        } else if (
          smartAccountExecFunctionName === 'executeBatch' ||
          smartAccountExecFunctionName === 'executeBatch_y6U'
        ) {
          const methodArgsSmartWalletExecuteCall = decodedSmartAccountData.args
          batchTo = methodArgsSmartWalletExecuteCall[0]
          batchValue = methodArgsSmartWalletExecuteCall[1]
          batchData = methodArgsSmartWalletExecuteCall[2]
        }

        if (approvalRequest.to && approvalRequest.data && approvalRequest.value) {
          batchTo = [approvalRequest.to, ...batchTo]
          batchValue = [approvalRequest.value, ...batchValue]
          batchData = [approvalRequest.data, ...batchData]

          newCallData = await this.encodeExecuteBatch(batchTo, batchValue, batchData)
        }
        let finalUserOp: Partial<UserOperation> = {
          ...userOp,
          callData: newCallData
        }

        // Requesting to update gas limits again (especially callGasLimit needs to be re-calculated)
        try {
          finalUserOp = await this.estimateUserOpGas(finalUserOp)
          const callGasLimit = ethers.BigNumber.from(finalUserOp.callGasLimit)
          if (finalUserOp.callGasLimit && callGasLimit.lt(ethers.BigNumber.from('21000'))) {
            return {
              ...userOp,
              callData: newCallData
            }
          }
          Logger.log('UserOp after estimation ', finalUserOp)
        } catch (error) {
          Logger.error('Failed to estimate gas for userOp with updated callData ', error)
          Logger.log(
            'Sending updated userOp. calculateGasLimit flag should be sent to the paymaster to be able to update callGasLimit'
          )
        }
        return finalUserOp
      }
    } catch (error) {
      Logger.log('Failed to update userOp. Sending back original op')
      Logger.error('Failed to update callData with error', error)
      return userOp
    }
    return userOp
  }

  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string> {
    this.isActiveValidationModuleDefined()
    const moduleSig = await this.activeValidationModule.signUserOpHash(userOpHash, params)

    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'address'],
      [moduleSig, this.activeValidationModule.getAddress()]
    )

    return signatureWithModuleAddress
  }

  async signMessage(message: Bytes | string): Promise<string> {
    this.isActiveValidationModuleDefined()
    const dataHash = ethers.utils.arrayify(ethers.utils.hashMessage(message))
    let signature = await this.activeValidationModule.signMessage(dataHash)

    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16)
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27
      signature = signature.slice(0, -2) + correctV.toString(16)
    }
    if (signature.slice(0, 2) !== '0x') {
      signature = '0x' + signature
    }

    // <<TODO>>
    // <<review>> if need to be added in signUserOpHash methods in validationModule as well
    // If the account is undeployed, use ERC-6492
    // Extend in child classes
    /*if (!(await this.isAccountDeployed(this.getSmartAccountAddress()))) {
      const coder = new ethers.utils.AbiCoder()
      sig =
        coder.encode(
          ['address', 'bytes', 'bytes'],
          [<FACTORY_ADDRESS>, <INIT_CODE>, sig]
        ) + '6492649264926492649264926492649264926492649264926492649264926492' // magic suffix
    }*/
    return signature
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

  // async isModuleEnabled(moduleName: string): boolean {

  async enableModule(moduleAddress: string): Promise<UserOpResponse> {
    const tx: Transaction = await this.getEnableModuleData(moduleAddress)
    const partialUserOp = await this.buildUserOp([tx])
    return this.sendUserOp(partialUserOp)
  }

  async getEnableModuleData(moduleAddress: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract()
    const populatedTransaction = await accountContract.populateTransaction.enableModule(
      moduleAddress
    )
    const tx: Transaction = {
      to: await this.getAccountAddress(),
      value: '0',
      data: populatedTransaction.data as string
    }
    return tx
  }

  async isModuleEnabled(moduleName: string): Promise<boolean> {
    const accountContract = await this._getAccountContract()
    return await accountContract.isModuleEnabled(moduleName)
  }

  // async getEnableModuleData(moduleName: string): Promise<string> {
}
