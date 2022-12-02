import {
  SignTransactionDto,
  SendTransactionDto,
  SendSignedTransactionDto,
  PrepareRefundTransactionDto,
  PrepareRefundTransactionsDto,
  RefundTransactionDto,
  RefundTransactionBatchDto,
  TransactionDto,
  TransactionBatchDto,
  ExecTransaction,
  RelayTransaction,
  IFeeRefundV1_0_0,
  IFeeRefundV1_0_1,
  IWalletTransaction,
  SmartAccountVersion,
  SignedTransaction,
  ChainId,
  SignTypeMethod,
  SmartAccountContext,
  SmartWalletFactoryContract,
  MultiSendContract,
  SmartWalletContract,
  AddressForCounterFactualWalletDto,
  RawTransactionType,
  SmartAccountState,
  FeeQuote,
  RelayResponse,
  SmartAccountConfig,
  IMetaTransaction,
  NetworkConfig,
  ZERO_ADDRESS
} from '@biconomy/core-types'
import { TypedDataSigner } from '@ethersproject/abstract-signer'
import NodeClient, {
  ChainConfig,
  SmartAccountsResponse,
  SmartAccountByOwnerDto,
  SCWTransactionResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse
} from '@biconomy/node-client'
import { Web3Provider } from '@ethersproject/providers'
import { IRelayer, RestRelayer } from '@biconomy/relayer'
import * as _ from 'lodash'
import TransactionManager, {
  ContractUtils,
  smartAccountSignMessage,
  smartAccountSignTypedData
} from '@biconomy/transactions'
import EventEmitter from 'events'
import { TransactionResponse } from '@ethersproject/providers'
import { SmartAccountSigner } from './signers/SmartAccountSigner'

// AA
import { newProvider, ERC4337EthersProvider } from '@biconomy/account-abstraction'

import { ethers, Signer } from 'ethers'

let isLogsEnabled: Boolean = false;

// Create an instance of Smart Account with multi-chain support.
class SmartAccount extends EventEmitter {
  // By default latest version
  DEFAULT_VERSION: SmartAccountVersion = '1.0.1'

  // Smart Account Context provies relevant contract instances for chainId asked (default is current active chain)
  context!: { [chainId: number]: SmartAccountContext }

  // Optional config to initialise instance of Smart Account. One can provide main active chain and only limited chains they need to be on.
  #smartAccountConfig!: SmartAccountConfig

  // Array of chain ids that current multi-chain instance supports
  supportedNetworkIds!: ChainId[]

  // Chain configurations fetched from backend
  chainConfig!: ChainConfig[]

  provider!: Web3Provider

  // 4337Provider
  aaProvider!: { [chainId: number]: ERC4337EthersProvider }

  signer!: Signer & TypedDataSigner

  nodeClient!: NodeClient

  contractUtils!: ContractUtils

  transactionManager!: TransactionManager

  // Instance of relayer (Relayer Service Client) connected with this Smart Account and always ready to dispatch transactions
  // relayer.relay => dispatch to blockchain
  // other methods are useful for the widget
  relayer!: IRelayer

  // Owner of the Smart Account common between all chains
  owner!: string

  // Address of the smart contract wallet common between all chains
  // @review
  address!: string

  // TODO : review from contractUtils
  smartAccountState!: SmartAccountState

  // provider type could be WalletProviderLike / ExternalProvider
  // Can expose recommended provider classes through the SDK
  // Note: If required Dapp devs can just pass on the signer in future

  /**
   * Constructor for the Smart Account. If config is not provided it makes Smart Account available using default configuration
   * If you wish to use your own backend server and relayer service, pass the URLs here
   */
  // Note: Could remove WalletProvider later on
  constructor(walletProvider: Web3Provider, config?: Partial<SmartAccountConfig>) {
    super()
    if(config && config.debug === true) {
      isLogsEnabled = true;
    }
    this.#smartAccountConfig = { ...DefaultSmartAccountConfig }
    this._logMessage('stage 1 : default config')
    this._logMessage(this.#smartAccountConfig)
    this._logMessage(this.#smartAccountConfig.networkConfig)

    if (!this.#smartAccountConfig.activeNetworkId) {
      throw Error('active chain needs to be specified')
    }

    if (this.#smartAccountConfig.supportedNetworksIds.length == 0)
      this.#smartAccountConfig.supportedNetworksIds = [this.#smartAccountConfig.activeNetworkId]

    let networkConfig: NetworkConfig[] = this.#smartAccountConfig.networkConfig

    if (config) {
      const customNetworkConfig: NetworkConfig[] = config.networkConfig || []
      this._logMessage('default network config')
      this._logMessage(networkConfig)
      this._logMessage('custom network config')
      this._logMessage(config.networkConfig)
      networkConfig = _.unionBy(customNetworkConfig, networkConfig, 'chainId')
      this._logMessage('merged network config values')
      this._logMessage(networkConfig)
      this._logMessage('smart account config before merge')
      this._logMessage(this.#smartAccountConfig)
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
      this.#smartAccountConfig.networkConfig = networkConfig
      this._logMessage('final smart account config before after merge')
      this._logMessage(this.#smartAccountConfig)
    }
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds

    // Should not break if we make this wallet connected provider optional (We'd have JsonRpcProvider / JsonRpcSender)
    this.provider = walletProvider
    this.signer = new SmartAccountSigner(this.provider)
    this.nodeClient = new NodeClient({ txServiceUrl: this.#smartAccountConfig.backendUrl })
    this.relayer = new RestRelayer({
      url: this.#smartAccountConfig.relayerUrl,
      socketServerUrl: this.#smartAccountConfig.socketServerUrl
    })
    this.aaProvider = {}
    this.chainConfig = []
  }

  /**
   * Single method to be used for logging purpose.
   *
   * @param {any} message Message to be logged
   */
  _logMessage(message: any) {
    if (isLogsEnabled && console.log) {
      console.log(message);
    }
  }

  getConfig(): SmartAccountConfig {
    return this.#smartAccountConfig
  }

  // Changes if we make change in nature of smart account signer
  getsigner(): Signer & TypedDataSigner {
    return this.signer
  } 

  getProviderUrl(network: ChainConfig): string {
    this._logMessage('after init smartAccountConfig.networkConfig')
    this._logMessage(this.#smartAccountConfig.networkConfig)
    const networkConfig: NetworkConfig[] = this.#smartAccountConfig.networkConfig
    this._logMessage(`networkConfig state is`)
    this._logMessage(networkConfig)
    let providerUrl =
      networkConfig.find((element: NetworkConfig) => element.chainId === network.chainId)
        ?.providerUrl || ''

    if (!providerUrl) providerUrl = network.providerUrl
    return providerUrl
  }

  getNetworkConfigValues(chainId: ChainId): NetworkConfig {
    const networkConfigValues = this.#smartAccountConfig.networkConfig?.find(
      (element: NetworkConfig) => element.chainId === chainId
    )
    if (!networkConfigValues) throw new Error('Could not get network config values')

    return networkConfigValues
  }

  async initializeContractsAtChain(chainId: ChainId) {
    let exist
    try {
      exist = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    } catch (err) {
      console.log('Instantiating chain ', chainId)
    }
    if (!exist) {
      this._logMessage('this.chainConfig')
      this._logMessage(this.chainConfig)
      const network = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
      if (!network) return
      const providerUrl = this.getProviderUrl(network)
      this._logMessage('init at chain')
      this._logMessage(chainId)
      const readProvider = new ethers.providers.JsonRpcProvider(providerUrl)
      this.contractUtils.initializeContracts(this.signer, readProvider, network)

      if (!this.address) {
        this.address = await this.getAddress({
          index: 0,
          chainId: network.chainId,
          version: this.DEFAULT_VERSION
        })
        console.log('smart wallet address is ', this.address)
      }

      if (!this.smartAccountState) {
        this.smartAccountState = {
          chainId: network.chainId,
          version: this.DEFAULT_VERSION,
          address: this.address,
          owner: this.owner,
          isDeployed: await this.contractUtils.isDeployed(
            network.chainId,
            this.DEFAULT_VERSION,
            this.address
          ), // could be set as state in init
          entryPointAddress: network.entryPoint[network.entryPoint.length - 1].address,
          fallbackHandlerAddress:
            network.fallBackHandler[network.fallBackHandler.length - 1].address
        }
      } else if (this.DEFAULT_VERSION !== this.smartAccountState.version) {
        this.smartAccountState = await this.contractUtils.getSmartAccountState(
          this.smartAccountState
        )
      }

      const clientConfig = this.getNetworkConfigValues(network.chainId)

      this.aaProvider[network.chainId] = await newProvider(
        new ethers.providers.JsonRpcProvider(providerUrl),
        {
          dappAPIKey: clientConfig.dappAPIKey || '',
          biconomySigningServiceUrl: this.#smartAccountConfig.biconomySigningServiceUrl || '',
          socketServerUrl: this.#smartAccountConfig.socketServerUrl || '',
          entryPointAddress: this.#smartAccountConfig.entryPointAddress
            ? this.#smartAccountConfig.entryPointAddress
            : network.entryPoint[network.entryPoint.length - 1].address,
          bundlerUrl: clientConfig.bundlerUrl || this.#smartAccountConfig.bundlerUrl || '',
          chainId: network.chainId,
          customPaymasterAPI: clientConfig.customPaymasterAPI
        },
        this.signer,
        this.address,
        network.fallBackHandler[network.fallBackHandler.length - 1].address,
        network.walletFactory[network.walletFactory.length - 1].address
      )
    }
  }

  async init() {
    this.setActiveChain(this.#smartAccountConfig.activeNetworkId)

    this.owner = await this.signer.getAddress()

    const chainConfig = (await this.nodeClient.getAllSupportedChains()).data

    this.contractUtils = new ContractUtils(chainConfig)

    for (let index = 0; index < this.#smartAccountConfig.supportedNetworksIds.length; index++) {
      const network = chainConfig.find(
        (element: ChainConfig) =>
          element.chainId === this.#smartAccountConfig.supportedNetworksIds[index]
      )
      if (network) {
        this.chainConfig.push(network)
      }
    }
    await this.initializeContractsAtChain(this.#smartAccountConfig.activeNetworkId)

    this.transactionManager = new TransactionManager(this.smartAccountState)

    await this.transactionManager.initialize(this.relayer, this.nodeClient, this.contractUtils)
    return this
  }

  // Nice to have
  // Optional methods for connecting paymaster
  // Optional methods for connecting another bundler

  public async sendGasLessTransaction(
    transactionDto: TransactionDto
  ): Promise<TransactionResponse> {
    let { version, chainId } = transactionDto
    const { transaction } = transactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    const aaSigner = this.aaProvider[this.#smartAccountConfig.activeNetworkId].getSigner()

    await this.initializeContractsAtChain(chainId)
    const multiSendContract = this.contractUtils.multiSendContract[chainId][version].getContract()

    const isDelegate = transaction.to === multiSendContract.address ? true : false

    const response = await aaSigner.sendTransaction(transaction, false, isDelegate, this)

    return response
    // todo: make sense of this response and return hash to the user
  }

  public async sendGaslessTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<TransactionResponse> {
    let { version, batchId, chainId } = transactionBatchDto
    const { transactions } = transactionBatchDto

    // Might get optional operation for tx
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0

    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(this.address)

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, version, this.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const txs: IMetaTransaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i]) {
        const innerTx: IMetaTransaction = {
          to: transactions[i].to,
          value: transactions[i].value || 0,
          operation: 0, // review
          data: transactions[i].data || '0x' // for token transfers use encodeTransfer
        }

        txs.push(innerTx)
      }
    }

    const multiSendContract = this.contractUtils.multiSendContract[chainId][version].getContract()

    const finalTx = this.transactionManager.utils.buildMultiSendTx(
      multiSendContract,
      txs,
      nonce,
      true
    )
    this._logMessage('final gasless batch tx ')
    this._logMessage(finalTx)

    const gaslessTx = {
      to: finalTx.to,
      data: finalTx.data,
      value: finalTx.value
    }

    // Multisend is tricky because populateTransaction expects delegateCall and we must override

    // TODO : stuff before this can be moved to TransactionManager
    const response = await this.sendGasLessTransaction({ version, transaction: gaslessTx, chainId })
    return response
  }

  // Only to deploy wallet using connected paymaster
  // Todo : Add return type
  // Review involvement of Dapp API Key
  public async deployWalletUsingPaymaster(): Promise<TransactionResponse> {
    // can pass chainId
    const aaSigner = this.aaProvider[this.#smartAccountConfig.activeNetworkId].getSigner()
    const transaction = {
      to: ZERO_ADDRESS,
      data: '0x'
    }
    const response = await aaSigner.sendTransaction(transaction, true, false, this)
    return response
    // Todo: make sense of this response and return hash to the user
  }

  /**
   *
   * @param smartAccountVersion
   * @description // set wallet version to be able to interact with different deployed versions
   */
  async setSmartAccountVersion(smartAccountVersion: SmartAccountVersion): Promise<SmartAccount> {
    this.DEFAULT_VERSION = smartAccountVersion
    this.address = await this.getAddress({
      index: 0,
      chainId: this.#smartAccountConfig.activeNetworkId,
      version: this.DEFAULT_VERSION
    })
    return this
  }

  // Todo
  // Review inputs as chainId is already part of Dto
  public async getAlltokenBalances(
    balancesDto: BalancesDto,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<BalancesResponse> {
    if (!balancesDto.chainId) balancesDto.chainId = chainId
    return this.nodeClient.getAlltokenBalances(balancesDto)
  }

  // Todo
  // Review inputs as chainId is already part of Dto
  public async getTotalBalanceInUsd(
    balancesDto: BalancesDto,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<UsdBalanceResponse> {
    if (!balancesDto.chainId) balancesDto.chainId = chainId
    return this.nodeClient.getTotalBalanceInUsd(balancesDto)
  }

  public async getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse> {
    return this.nodeClient.getSmartAccountsByOwner(smartAccountByOwnerDto)
  }

  //Todo add description
  public async getTransactionByAddress(
    chainId: number,
    address: string
  ): Promise<SCWTransactionResponse[]> {
    return this.nodeClient.getTransactionByAddress(chainId, address)
  }

  public async getTransactionByHash(txHash: string): Promise<SCWTransactionResponse> {
    return this.nodeClient.getTransactionByHash(txHash)
  }

  // Assigns transaction relayer to this smart wallet instance
  /**
   * Assigns transaction relayer to this smart wallet instance
   * @notice Assumption is that relayer will accept calls for all supported chains
   * @param relayer Relayer client to be associated with this smart account
   * @returns this/self
   */
  async setRelayer(relayer: IRelayer): Promise<SmartAccount> {
    if (relayer === undefined) return this
    this.relayer = relayer
    //If we end up maintaining relayer instance on this then it should update all transaction managers
    //await this.transactionManager.setRelayer(relayer)
    return this
  }

  /**
   * Allows to change default active chain of the Smart Account
   * @todo make a check if chain is supported in config
   * @param chainId
   * @returns self/this
   */
  async setActiveChain(chainId: ChainId): Promise<SmartAccount> {
    this.#smartAccountConfig.activeNetworkId = chainId
    await this.initializeContractsAtChain(this.#smartAccountConfig.activeNetworkId)
    return this
  }

  /**
   *
   * @notice personal sign is used currently (// @todo Signer should be able to use _typedSignData)
   * @param tx IWalletTransaction Smart Account Transaction object prepared
   * @param chainId optional chainId
   * @returns:string Signature
   */
  async signTransaction(signTransactionDto: SignTransactionDto): Promise<string> {
    const { chainId = this.#smartAccountConfig.activeNetworkId, tx } = signTransactionDto
    const signatureType = this.#smartAccountConfig.signType
    let walletContract = this.smartAccount(chainId).getContract()
    walletContract = walletContract.attach(this.address)
    let signature = '0x'
    if (signatureType === SignTypeMethod.PERSONAL_SIGN) {
      const { signer, data } = await smartAccountSignMessage(
        this.signer,
        walletContract,
        tx,
        chainId
      )
      signature += data.slice(2)
    } else {
      const { signer, data } = await smartAccountSignTypedData(
        this.signer,
        walletContract,
        tx,
        chainId
      )
      signature += data.slice(2)
    }
    return signature
    // return this.signer.signTransaction(signTransactionDto)
  }

  // This would be a implementation on user sponsorship provider
  /**
   * Prepares encoded wallet transaction, gets signature from the signer and dispatches to the blockchain using relayer
   * @param tx IWalletTransaction Smart Account Transaction object prepared
   * @param batchId optional nonce space for parallel processing
   * @param chainId optional chainId
   * @returns transactionId : transaction identifier
   */
  async sendTransaction(sendTransactionDto: SendTransactionDto): Promise<string> {
    let { chainId } = sendTransactionDto
    const { tx, batchId = 0 } = sendTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    let { gasLimit } = sendTransactionDto
    const isDeployed = await this.contractUtils.isDeployed(
      chainId,
      this.DEFAULT_VERSION,
      this.address
    )
    const rawTx: RawTransactionType = {
      to: tx.to,
      data: tx.data,
      value: 0,
      chainId: chainId
    }

    const transaction: ExecTransaction = {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      operation: tx.operation,
      targetTxGas: tx.targetTxGas
    }

    const refundInfo: IFeeRefundV1_0_0 | IFeeRefundV1_0_1 = {
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      tokenGasPriceFactor: tx.tokenGasPriceFactor,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver
    }

    let walletContract =
      this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    walletContract = walletContract.attach(this.address)

    const signature = await this.signTransaction({
      version: this.DEFAULT_VERSION,
      tx,
      chainId,
      signer: this.signer
    })

    const execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      batchId,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.contractUtils.getSmartAccountState(
      this.smartAccountState,
      this.DEFAULT_VERSION,
      this.#smartAccountConfig.activeNetworkId
    )

    const signedTx: SignedTransaction = {
      rawTx,
      tx
    }
    const relayTrx: RelayTransaction = {
      signedTx,
      config: state,
      context: this.getSmartAccountContext(chainId)
    }
    if (gasLimit) {
      relayTrx.gasLimit = gasLimit
    }
    if (!isDeployed) {
      gasLimit = {
        hex: '0x1E8480',
        type: 'hex'
      }
      relayTrx.gasLimit = gasLimit
    }
    const relayResponse: RelayResponse = await this.relayer.relay(relayTrx, this)
    console.log('relayResponse')
    console.log(relayResponse)
    if (relayResponse.transactionId) {
      return relayResponse.transactionId
    }
    return ''
  }

  async sendSignedTransaction(sendSignedTransactionDto: SendSignedTransactionDto): Promise<string> {
    let { chainId } = sendSignedTransactionDto
    const { tx, batchId = 0, signature } = sendSignedTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    let { gasLimit } = sendSignedTransactionDto
    const isDeployed = await this.contractUtils.isDeployed(
      chainId,
      this.DEFAULT_VERSION,
      this.address
    )
    const rawTx: RawTransactionType = {
      to: tx.to,
      data: tx.data,
      value: 0,
      chainId: chainId
    }

    const transaction: ExecTransaction = {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      operation: tx.operation,
      targetTxGas: tx.targetTxGas
    }

    const refundInfo: IFeeRefundV1_0_0 | IFeeRefundV1_0_1 = {
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      tokenGasPriceFactor: tx.tokenGasPriceFactor,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver
    }

    let walletContract =
      this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    walletContract = walletContract.attach(this.address)

    const execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      batchId,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.contractUtils.getSmartAccountState(
      this.smartAccountState,
      this.DEFAULT_VERSION,
      this.#smartAccountConfig.activeNetworkId
    )

    const signedTx: SignedTransaction = {
      rawTx,
      tx
    }
    const relayTrx: RelayTransaction = {
      signedTx,
      config: state,
      context: this.getSmartAccountContext(chainId)
    }
    if (gasLimit) {
      relayTrx.gasLimit = gasLimit
    }
    // todo : review gasLimit passed to relay endpoint
    if (!isDeployed) {
      gasLimit = {
        hex: '0x1E8480',
        type: 'hex'
      }
      relayTrx.gasLimit = gasLimit
    }
    const relayResponse: RelayResponse = await this.relayer.relay(relayTrx, this)
    console.log('relayResponse')
    console.log(relayResponse)
    if (relayResponse.transactionId) {
      return relayResponse.transactionId
    }
    return ''
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param prepareRefundTransactionDto
   */
  async prepareRefundTransaction(
    prepareRefundTransactionDto: PrepareRefundTransactionDto
  ): Promise<FeeQuote[]> {
    let { version, batchId, chainId } = prepareRefundTransactionDto
    const { transaction } = prepareRefundTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0
    return this.transactionManager.prepareRefundTransaction({
      chainId,
      version,
      transaction,
      batchId
    })
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param prepareRefundTransactionsDto
   */
  // TODO: Rename method to getFeeOptionsForBatch
  async prepareRefundTransactionBatch(
    prepareRefundTransactionsDto: PrepareRefundTransactionsDto
  ): Promise<FeeQuote[]> {
    let { version, batchId, chainId } = prepareRefundTransactionsDto
    const { transactions } = prepareRefundTransactionsDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0
    return this.transactionManager.prepareRefundTransactionBatch({
      version,
      chainId,
      batchId,
      transactions
    })
  }

  // Other helpers go here for pre build (feeOptions and quotes from relayer) , build and execution of refund type transactions
  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param refundTransactionDto
   * @returns
   */
  async createRefundTransaction(
    refundTransactionDto: RefundTransactionDto
  ): Promise<IWalletTransaction> {
    let { version, batchId, chainId } = refundTransactionDto
    const { transaction, feeQuote } = refundTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0
    return this.transactionManager.createRefundTransaction({
      version,
      transaction,
      batchId,
      chainId,
      feeQuote
    })
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  // Todo : Marked for deletion
  async createTransaction(transactionDto: TransactionDto): Promise<IWalletTransaction> {
    let { version, batchId, chainId } = transactionDto
    const { transaction } = transactionDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0
    return this.transactionManager.createTransaction({ chainId, version, batchId, transaction })
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @todo Write test case and limit batch size based on test results in scw-contracts
   * @notice This transaction is without fee refund (gasless)
   * @param transaction
   * @param batchId
   * @param chainId
   * @returns
   */
  // Todo: Marked for deletion
  async createTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<IWalletTransaction> {
    let { version, batchId, chainId } = transactionBatchDto
    const { transactions } = transactionBatchDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0
    return this.transactionManager.createTransactionBatch({
      version,
      transactions,
      chainId,
      batchId
    })
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param refundTransactionBatchDto
   * @returns
   */
  async createRefundTransactionBatch(
    refundTransactionBatchDto: RefundTransactionBatchDto
  ): Promise<IWalletTransaction> {
    let { version, batchId, chainId } = refundTransactionBatchDto
    const { transactions, feeQuote } = refundTransactionBatchDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0
    return this.transactionManager.createRefundTransactionBatch({
      version,
      transactions,
      chainId,
      batchId,
      feeQuote
    })
  }

  async prepareDeployAndPayFees(chainId?: ChainId) {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    return this.transactionManager.prepareDeployAndPayFees(chainId, this.DEFAULT_VERSION)
  }

  // Onboarding scenario where assets inside counterfactual smart account pays for it's deployment
  async deployAndPayFees(chainId: ChainId, feeQuote: FeeQuote): Promise<string> {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    const transaction = await this.transactionManager.deployAndPayFees(
      chainId,
      this.DEFAULT_VERSION,
      feeQuote
    )
    const txHash = await this.sendTransaction({ tx: transaction })
    return txHash
  }

  // Todo: sendSignedTransaction (only applies for Refund transaction )

  /**
   *
   * @param chainId optional chainId
   * @returns Smart Wallet Contract instance attached with current smart account address (proxy)
   */
  smartAccount(chainId?: ChainId): SmartWalletContract {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    const smartWallet = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION]
    const address = this.address
    smartWallet.getContract().attach(address)
    return smartWallet
  }

  /**
   *
   * @param chainId optional chainId
   * @returns Smart Wallet Factory instance for requested chainId
   */
  factory(chainId?: ChainId): SmartWalletFactoryContract {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    return this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION]
  }

  multiSend(chainId?: ChainId): MultiSendContract {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    return this.contractUtils.multiSendContract[chainId][this.DEFAULT_VERSION]
  }

  // Note: expose getMultiSend(), getMultiSendCall()

  // TODO
  // Note: get Address method should not be here as we are passing smart account state
  // Marked for deletion
  async getAddress(
    addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
  ): Promise<string> {
    // TODO: Get from node client first from cache, if not found then query smart contract
    const { index, chainId, version } = addressForCounterFactualWalletDto

    const address = await this.contractUtils.smartWalletFactoryContract[chainId][
      version
    ].getAddressForCounterfactualWallet(this.owner, index)
    this.address = address
    return address
  }

  /**
   * Allows one to check if the smart account is already deployed on requested chainOd
   * @review
   * @notice the check is made on Wallet Factory state with current address in Smart Account state
   * @param chainId optional chainId : Default is current active
   * @returns
   */
  async isDeployed(chainId: ChainId): Promise<boolean> {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId

    return await this.contractUtils.smartWalletFactoryContract[chainId][
      this.DEFAULT_VERSION
    ].isWalletExist(this.address)
  }

  /**
   * @review for owner
   * @param chainId requested chain : default is active chain
   * @returns object containing infromation (owner, relevant contract addresses, isDeployed) about Smart Account for requested chain
   */
  async getSmartAccountState(chainId?: ChainId): Promise<SmartAccountState> {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    return this.contractUtils.getSmartAccountState(
      this.smartAccountState,
      this.DEFAULT_VERSION,
      this.#smartAccountConfig.activeNetworkId
    )
  }

  //
  /**
   * Serves smart contract instances associated with Smart Account for requested ChainId
   * Context is useful when relayer is deploying a wallet
   * @param chainId requested chain : default is active chain
   * @returns object containing relevant contract instances
   */
  getSmartAccountContext(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    chainId?: ChainId
  ): SmartAccountContext {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId

    const context: SmartAccountContext = this.contractUtils.getSmartAccountContext(
      chainId,
      this.DEFAULT_VERSION
    )
    return context
  }
}

// Current default config
// TODO/NOTE : Goerli and Mumbai as test networks and remove others
export const DefaultSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.POLYGON_MUMBAI, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI, ChainId.POLYGON_MAINNET, ChainId.BSC_TESTNET],
  signType: SignTypeMethod.EIP712_SIGN,
  backendUrl: 'https://sdk-backend.prod.biconomy.io/v1',
  relayerUrl: 'https://sdk-relayer.prod.biconomy.io/api/v1/relay',
  socketServerUrl: 'wss://sdk-ws.prod.biconomy.io/connection/websocket',
  bundlerUrl: 'https://sdk-relayer.prod.biconomy.io/api/v1/relay',
  biconomySigningServiceUrl:
    'https://us-central1-biconomy-staging.cloudfunctions.net/signing-service',
  // TODO : has to be public provider urls (local config / backend node)
  networkConfig: [
    {
      chainId: ChainId.GOERLI,
      providerUrl: 'https://eth-goerli.alchemyapi.io/v2/lmW2og_aq-OXWKYRoRu-X6Yl6wDQYt_2'
    },
    {
      chainId: ChainId.POLYGON_MUMBAI,
      providerUrl: 'https://polygon-mumbai.g.alchemy.com/v2/Q4WqQVxhEEmBYREX22xfsS2-s5EXWD31'
    },
    {
      chainId: ChainId.BSC_TESTNET,
      providerUrl:
        'https://wandering-broken-tree.bsc-testnet.quiknode.pro/7992da20f9e4f97c2a117bea9af37c1c266f63ec/'
    },
    {
      chainId: ChainId.POLYGON_MAINNET,
      providerUrl: 'https://polygon-mainnet.g.alchemy.com/v2/6Tn--QDkp1vRBXzRV3Cc8fLXayr5Yoij'
    }
  ],
    debug: false
}

export default SmartAccount
