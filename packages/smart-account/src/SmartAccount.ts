import {
  SignUserPaidTransactionDto,
  SendUserPaidTransactionDto,
  SendUserPaidSignedTransactionDto,
  GetFeeQuotesDto,
  GetFeeQuotesForBatchDto,
  CreateUserPaidTransactionDto,
  CreateUserPaidTransactionBatchDto,
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
  Environments,
  NetworkConfig,
  ZERO_ADDRESS,
  IFallbackAPI
} from '@biconomy/core-types'
import EvmNetworkManager from '@biconomy/ethers-lib'

import NodeClient, {
  ISmartAccount,
  ChainConfig,
  SmartAccountsResponse,
  SmartAccountByOwnerDto,
  SCWTransactionResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse
} from '@biconomy/node-client'
import { JsonRpcProvider, Provider, Web3Provider } from '@ethersproject/providers'
import { IRelayer, RestRelayer, FallbackRelayer, IFallbackRelayer } from '@biconomy/relayer'
import * as _ from 'lodash'
import TransactionManager, {
  getSmartWalletFactoryContract,
  ContractUtils,
  encodeMultiSend,
  smartAccountSignMessage,
  smartAccountSignTypedData
} from '@biconomy/transactions'
import EventEmitter from 'events'
import { TransactionResponse } from '@ethersproject/providers'
import { SmartAccountSigner } from './signers/SmartAccountSigner'
import { DevelopmentConfig, StagingConfig, ProductionConfig } from './config'
// AA
import {
  newProvider,
  ERC4337EthersProvider,
  FallbackGasTankAPI,
  ERC4337EthersSigner,
  BaseAccountAPI
} from '@biconomy/account-abstraction'
import {
  Logger,
  deployCounterFactualEncodedData,
  getWalletInfo,
  updateImplementationEncodedData,
  fallbackHandlerEncodedData
} from '@biconomy/common'

import { BigNumber, ethers, Signer } from 'ethers'
import { Transaction } from '@biconomy/core-types'

// Create an instance of Smart Account with multi-chain support.
class SmartAccount extends EventEmitter {
  // By default latest version
  DEFAULT_VERSION: SmartAccountVersion = '1.0.0'

  // Smart Account Context provies relevant contract instances for chainId asked (default is current active chain)
  context!: { [chainId: number]: SmartAccountContext }

  // Optional config to initialise instance of Smart Account. One can provide main active chain and only limited chains they need to be on.
  #smartAccountConfig!: SmartAccountConfig

  // Array of chain ids that current multi-chain instance supports
  supportedNetworkIds!: ChainId[]

  // Chain configurations fetched from backend
  chainConfig!: ChainConfig[]

  provider!: JsonRpcProvider

  // 4337Provider
  aaProvider!: { [chainId: number]: ERC4337EthersProvider }

  signer!: Signer

  nodeClient!: NodeClient

  contractUtils!: ContractUtils

  transactionManager!: TransactionManager

  // Instance of relayer (Relayer Service Client) connected with this Smart Account and always ready to dispatch transactions
  // relayer.relay => dispatch to blockchain
  // other methods are useful for the widget
  relayer!: IRelayer

  fallbackRelayer!: IFallbackRelayer

  private signingService!: IFallbackAPI

  // Owner of the Smart Account common between all chains
  owner!: string

  // Address of the smart contract wallet common between all chains
  address!: string

  smartAccountState!: SmartAccountState

  // WIP
  // Could expose recommended provider classes through the SDK

  /**
   * Constructor for the Smart Account. If config is not provided it makes Smart Account available using default configuration
   * If you wish to use your own backend server and relayer service, pass the URLs here
   */
  constructor(signerOrProvider: Web3Provider | Signer, config?: Partial<SmartAccountConfig>) {
    super()
    const env = config?.environment ?? Environments.PROD

    if (!env || env === Environments.PROD) {
      Logger.log('Client connected to production environment')
      this.#smartAccountConfig = { ...ProductionConfig }
    } else if (env && env === Environments.DEV) {
      Logger.log('Client connected to testing environment')
      this.#smartAccountConfig = { ...DevelopmentConfig }
    } else {
      Logger.log('Client connected to STAGING')
      this.#smartAccountConfig = { ...StagingConfig }
    }

    if (!this.#smartAccountConfig.activeNetworkId) {
      throw Error('active chain needs to be specified')
    }

    if (this.#smartAccountConfig.supportedNetworksIds.length == 0)
      this.#smartAccountConfig.supportedNetworksIds = [this.#smartAccountConfig.activeNetworkId]

    let networkConfig: NetworkConfig[] = this.#smartAccountConfig.networkConfig

    if (config) {
      const customNetworkConfig: NetworkConfig[] = config.networkConfig || []
      Logger.log('Custom network config', customNetworkConfig)

      if (customNetworkConfig.length !== 0) {
        const mergedNetworkConfig = _.merge(
          _.keyBy(customNetworkConfig, 'chainId'),
          _.keyBy(networkConfig, 'chainId')
        )
        networkConfig = _.values(mergedNetworkConfig)
      }
      Logger.log('Merged network config values', networkConfig)
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
      this.#smartAccountConfig.networkConfig = networkConfig
    }
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds

    if (Signer.isSigner(signerOrProvider)) {
      this.signer = signerOrProvider
    } else if (Provider.isProvider(signerOrProvider)) {
      this.signer = new SmartAccountSigner(signerOrProvider)
    } else {
      Logger.error('signer or provider is not valid')
    }
    this.nodeClient = new NodeClient({ txServiceUrl: this.#smartAccountConfig.backendUrl })
    this.relayer = new RestRelayer({
      url: this.#smartAccountConfig.relayerUrl,
      socketServerUrl: this.#smartAccountConfig.socketServerUrl
    })
    this.aaProvider = {}
    this.chainConfig = []
  }

  getConfig(): SmartAccountConfig {
    return this.#smartAccountConfig
  }

  // Changes if we make change in nature of smart account signer
  getsigner(): Signer {
    return this.signer
  }

  getSmartAccountAPI(chainId: ChainId): BaseAccountAPI {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    const aaSigner: ERC4337EthersSigner = this.aaProvider[chainId].getSigner()
    return aaSigner.smartAccountAPI
  }

  getProviderUrl(network: ChainConfig): string {
    Logger.log(
      'after init smartAccountConfig.networkConfig',
      this.#smartAccountConfig.networkConfig
    )
    const networkConfig: NetworkConfig[] = this.#smartAccountConfig.networkConfig
    Logger.log(`networkConfig state is`, networkConfig)
    let providerUrl =
      networkConfig.find((element: NetworkConfig) => element.chainId === network.chainId)
        ?.providerUrl || ''

    Logger.log('provider url in unioned network config ', providerUrl)
    if (!providerUrl) {
      Logger.log('using rpc url from chain seed ', network.providerUrl)
      providerUrl = network.providerUrl
    }
    return providerUrl
  }

  async getNetworkConfigValues(chainId: ChainId): Promise<NetworkConfig> {
    const networkConfigValues = await this.#smartAccountConfig.networkConfig?.find(
      (element: NetworkConfig) => element.chainId === chainId
    )
    if (!networkConfigValues) throw new Error('Could not get network config values')

    return networkConfigValues
  }

  async initializeAtChain(chainId: ChainId) {
    let exist
    try {
      exist = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    } catch (err) {
      Logger.log('Chain config contract not loaded ', chainId)
    }
    if (!exist) {
      const network = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
      if (!network) return
      const providerUrl = this.getProviderUrl(network)
      Logger.log('init at chain', chainId)

      const walletInfo = await this.getAddress({
        index: 0,
        chainId: network.chainId,
        version: this.DEFAULT_VERSION
      })
      Logger.log('smart wallet address is ', this.address)

      const readProvider = new ethers.providers.JsonRpcProvider(providerUrl)
      this.provider = readProvider
      this.contractUtils.initializeContracts(this.signer, readProvider, walletInfo, network)

      const clientConfig = await this.getNetworkConfigValues(network.chainId)

      this.signingService = new FallbackGasTankAPI(
        this.#smartAccountConfig.biconomySigningServiceUrl || '',
        clientConfig.dappAPIKey || ''
      )

      this.fallbackRelayer = new FallbackRelayer({
        dappAPIKey: clientConfig.dappAPIKey || '',
        url: this.#smartAccountConfig.relayerUrl,
        relayerServiceUrl: this.#smartAccountConfig.socketServerUrl
      })

      this.aaProvider[network.chainId] = await newProvider(
        new ethers.providers.JsonRpcProvider(providerUrl),
        {
          dappAPIKey: clientConfig.dappAPIKey || '',
          // Review: default false
          // could come from global set config or method level when we implement fee mode
          strictSponsorshipMode: this.#smartAccountConfig.strictSponsorshipMode || false,
          biconomySigningServiceUrl: this.#smartAccountConfig.biconomySigningServiceUrl || '',
          socketServerUrl: this.#smartAccountConfig.socketServerUrl || '',
          entryPointAddress: this.#smartAccountConfig.entryPointAddress
            ? this.#smartAccountConfig.entryPointAddress
            : network.entryPoint[network.entryPoint.length - 1].address,
          bundlerUrl: clientConfig.bundlerUrl || this.#smartAccountConfig.bundlerUrl || '',
          chainId: network.chainId,
          customPaymasterAPI: clientConfig.customPaymasterAPI,
          txServiceUrl: this.#smartAccountConfig.backendUrl
        },
        this.signer,
        this.address,
        network.wallet[network.wallet.length - 1].address,
        network.fallBackHandler[network.fallBackHandler.length - 1].address,
        network.walletFactory[network.walletFactory.length - 1].address
      )
    }
  }

  async init() {
    try {
      this.owner = await this.signer.getAddress()
    } catch (error) {
      throw new Error('Invalid Provider, cant get signer address')
    }
    this.setActiveChain(this.#smartAccountConfig.activeNetworkId)

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
    await this.initializeAtChain(this.#smartAccountConfig.activeNetworkId)

    this.transactionManager = new TransactionManager(this.contractUtils.getSmartAccountState())

    await this.transactionManager.initialize(this.relayer, this.nodeClient, this.contractUtils)
    return this
  }

  // WIP
  // Optional methods for connecting paymaster
  // Optional methods for connecting another bundler

  async sendFallbackTransaction(transactionDto: TransactionDto): Promise<TransactionResponse> {
    let { version, chainId } = transactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION

    await this.initializeAtChain(chainId)

    // create IWalletTransaction instance
    const transaction = await this.createTransaction(transactionDto)

    // create instance of SmartWallet contracts
    const walletContract = this.contractUtils.attachWalletContract(
      chainId,
      this.DEFAULT_VERSION,
      this.address
    )

    const signature = await this.signUserPaidTransaction({
      version: this.DEFAULT_VERSION,
      tx: transaction,
      chainId,
      signer: this.signer
    })
    const refundInfo: IFeeRefundV1_0_0 | IFeeRefundV1_0_1 = {
      baseGas: transaction.baseGas,
      gasPrice: transaction.gasPrice,
      tokenGasPriceFactor: transaction.tokenGasPriceFactor,
      gasToken: transaction.gasToken,
      refundReceiver: transaction.refundReceiver
    }

    const execTransactionData = await walletContract.interface.encodeFunctionData(
      'execTransaction',
      [transaction, refundInfo, signature]
    )

    // create instance of fallbackGasTank contracts to get nonce
    const fallbackGasTank =
      this.contractUtils.fallbackGasTankContract[chainId][version].getContract()
    const gasTankNonce = await fallbackGasTank.getNonce(this.address)

    const isDeployed = await this.contractUtils.isDeployed(chainId, this.address)
    // dappIdentifier and signature will be added by signing service
    const fallbackUserOp = {
      sender: this.address,
      target: this.address,
      nonce: gasTankNonce,
      callData: execTransactionData || '',
      callGasLimit: BigNumber.from(800000), // will be updated below
      dappIdentifier: '',
      signature: ''
    }
    if (!isDeployed) {
      const network = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
      if (!network) throw new Error('No Network Found for given chainid')

      const { multiSendCall, walletFactory } = this.getSmartAccountContext(chainId)
      const deployWalletEncodedData = await deployCounterFactualEncodedData({
        chainId: (await this.provider.getNetwork())?.chainId,
        owner: await this.owner,
        txServiceUrl: this.#smartAccountConfig.backendUrl,
        index: 0
      })
      const txs = [
        {
          to: walletFactory.getAddress(),
          value: 0,
          data: deployWalletEncodedData,
          operation: 0
        },
        {
          to: this.address,
          value: 0,
          data: execTransactionData || '',
          operation: 0
        }
      ]
      const txnData = multiSendCall
        .getInterface()
        .encodeFunctionData('multiSend', [encodeMultiSend(txs)])
      Logger.log('txnData', txnData)

      // update fallbackUserOp with target and multiSend call data
      fallbackUserOp.target = multiSendCall.getAddress()
      fallbackUserOp.callData = txnData
    }

    Logger.log('fallbackUserOp before', fallbackUserOp)
    // send fallback user operation to signing service to get signature and dappIdentifier
    const signingServiceResponse = await this.signingService.getDappIdentifierAndSign(
      fallbackUserOp
    )
    fallbackUserOp.dappIdentifier = signingServiceResponse.dappIdentifier
    fallbackUserOp.signature = signingServiceResponse.signature
    Logger.log('fallbackUserOp after', fallbackUserOp)

    const handleFallBackData = await fallbackGasTank.populateTransaction.handleFallbackUserOp(
      fallbackUserOp
    )

    const rawTrx: RawTransactionType = {
      to: fallbackGasTank.address, // gas tank address
      data: handleFallBackData.data, // populateTransaction by fallbackGasTank contract handleFallbackUserop
      value: 0, // tx value
      chainId: chainId
    }
    const signedTx: SignedTransaction = {
      rawTx: rawTrx,
      tx: transaction
    }
    const state = await this.contractUtils.getSmartAccountState()
    const relayTrx: RelayTransaction = {
      signedTx,
      config: state,
      context: this.getSmartAccountContext(chainId)
    }
    const relayResponse = await this.fallbackRelayer.relay(relayTrx, this)
    return relayResponse
  }

  /**
   * @description this function will make complete transaction data for updateImplementationTrx
   * @param chainId
   * @returns
   */

  async updateImplementationTrx(chainId: ChainId): Promise<Transaction> {
    const isWalletDeployed = await this.isDeployed(chainId)
    if (isWalletDeployed) {
      const chainInfo = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
      if (!chainInfo) {
        throw new Error('No ChainInfo Found')
      }
      const latestImpAddress = chainInfo.wallet[chainInfo.wallet.length - 1].address
      const walletsImpAddress = await this.contractUtils.getSmartAccountState()
        .implementationAddress
      if (latestImpAddress !== walletsImpAddress) {
        const updateImplementationCallData = await updateImplementationEncodedData(latestImpAddress)
        return { to: this.address, value: BigNumber.from(0), data: updateImplementationCallData }
      }
    }
    return { to: this.address, value: 0, data: '0x' }
  }

  /**
   * @description this function will make complete transaction data for updateFallBackHandlerTrx
   * @param chainId
   * @returns
   */
  async updateFallBackHandlerTrx(chainId: ChainId): Promise<Transaction> {
    const isWalletDeployed = await this.isDeployed(chainId)
    if (isWalletDeployed) {
      const chainInfo = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
      if (!chainInfo) {
        throw new Error('No ChainInfo Found')
      }
      const latestfallBackHandlerAddress =
        chainInfo.fallBackHandler[chainInfo.fallBackHandler.length - 1].address
      const walletInfo = await this.contractUtils.getSmartAccountState()
      const fallBackHandlerAddress = walletInfo.fallbackHandlerAddress

      if (latestfallBackHandlerAddress !== fallBackHandlerAddress) {
        const fallbackHandlerCallData = await fallbackHandlerEncodedData(
          latestfallBackHandlerAddress
        )
        return { to: this.address, value: BigNumber.from(0), data: fallbackHandlerCallData }
      }
    }
    return { to: this.address, value: 0, data: '0x' }
  }

  /**
   * @description this function will let dapp to update Base wallet Implemenation to Latest
   * @returns
   */
  public async updateFallbackHandler(): Promise<TransactionResponse> {
    const chainId = this.#smartAccountConfig.activeNetworkId
    const fallbackHandlerTrx = await this.updateFallBackHandlerTrx(
      this.#smartAccountConfig.activeNetworkId
    )
    await this.initializeAtChain(chainId)
    const aaSigner = this.aaProvider[chainId].getSigner()
    const response = await aaSigner.sendTransaction(fallbackHandlerTrx, false, {}, this)
    return response
  }

  /**
   * @description this function will let dapp to update FallBackHandler to Latest
   * @returns
   */
  public async updateImplementation(): Promise<TransactionResponse> {
    const chainId = this.#smartAccountConfig.activeNetworkId
    const updateImplTrx = await this.updateImplementationTrx(
      this.#smartAccountConfig.activeNetworkId
    )
    await this.initializeAtChain(chainId)
    const aaSigner = this.aaProvider[chainId].getSigner()
    const response = await aaSigner.sendTransaction(updateImplTrx, false, {}, this)
    return response
  }

  // TODO: single method. can have types as aa-4337 and non-4337. can have fee modes based on types
  public async sendTransaction(
    transactionDto: TransactionDto // TODO: revise DTO as per above
    // isUpdateImpTrx?: Boolean
  ): Promise<TransactionResponse> {
    // let isFallbackEnabled = false
    // // try {
    // //   const { data } = await this.nodeClient.isFallbackEnabled()
    // //   isFallbackEnabled = data.enable_fallback_flow
    // //   Logger.log('isFallbackEnabled', data.enable_fallback_flow)
    // // } catch (error) {
    // //   console.error('isFallbackEnabled', error)
    // // }

    // if (isFallbackEnabled) {
    //   return this.sendFallbackTransaction(transactionDto)
    // }

    let { chainId } = transactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    // version = version ? version : this.DEFAULT_VERSION
    const aaSigner = this.aaProvider[chainId].getSigner()

    await this.initializeAtChain(chainId)
    const batchTrx = []
    const updateImplTrx = await this.updateImplementationTrx(chainId)
    let response

    // this case will run when user is making any normal trx and we have detected that the wallet is
    // not pointing to latest implementation so will merge user's trx with update Implementation Trx and
    // Batch both trx
    //     if ( updateImplTrx.data != '0x' && !isUpdateImpTrx){

    if (updateImplTrx.data != '0x') {
      batchTrx.push(updateImplTrx, transactionDto.transaction)
      response = this.sendTransactionBatch({
        transactions: batchTrx,
        paymasterServiceData: transactionDto.paymasterServiceData
      })
    } else {
      // this case { if ( isUpdateImpTrx ) } will work only when user specifically wanted to just update Base wallet Implementation
      // if ( isUpdateImpTrx )
      // transactionDto.transaction = updateImplTrx

      response = await aaSigner.sendTransaction(
        transactionDto.transaction,
        false,
        transactionDto.paymasterServiceData,
        this
      )
    }
    return response
  }

  public async sendTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<TransactionResponse> {
    let { chainId } = transactionBatchDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId

    const { transactions, paymasterServiceData } = transactionBatchDto

    const aaSigner = this.aaProvider[chainId].getSigner()

    const updateImplTrx = await this.updateImplementationTrx(chainId)
    // whatever batch trx user make. will ensure to update Base wallet implementation if needed
    if (updateImplTrx.data != '0x') {
      transactions.unshift(updateImplTrx)
    }
    const response = await aaSigner.sendTransactionBatch(transactions, paymasterServiceData, this)
    return response
  }

  // Only to deploy wallet using connected paymaster
  public async deployWalletUsingPaymaster(): Promise<TransactionResponse> {
    const aaSigner = this.aaProvider[this.#smartAccountConfig.activeNetworkId].getSigner()
    const transaction = {
      to: ZERO_ADDRESS,
      data: '0x'
    }
    const response = await aaSigner.sendTransaction(transaction, true, {}, this)
    return response
  }

  /**
   *
   * @param smartAccountVersion
   * @description // set wallet version to be able to interact with different deployed versions
   */
  async setSmartAccountVersion(smartAccountVersion: SmartAccountVersion): Promise<SmartAccount> {
    this.DEFAULT_VERSION = smartAccountVersion
    await this.getAddress({
      index: 0,
      chainId: this.#smartAccountConfig.activeNetworkId,
      version: this.DEFAULT_VERSION
    })
    return this
  }

  public async getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse> {
    return this.nodeClient.getAlltokenBalances(balancesDto)
  }

  public async getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse> {
    return this.nodeClient.getTotalBalanceInUsd(balancesDto)
  }

  public async getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse> {
    return this.nodeClient.getSmartAccountsByOwner(smartAccountByOwnerDto)
  }

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
   * @param chainId
   * @returns self/this
   */
  async setActiveChain(chainId: ChainId): Promise<SmartAccount> {
    this.#smartAccountConfig.activeNetworkId = chainId
    await this.initializeAtChain(this.#smartAccountConfig.activeNetworkId)
    return this
  }

  // TODO: single method. can have types as aa-4337 and non-4337. can have fee modes based on types
  /*async signTransaction() {

  }*/

  /**
   *
   * @notice personal sign is used currently (Signer should be able to use _typedSignData)
   * @param tx IWalletTransaction Smart Account Transaction object prepared
   * @param chainId optional chainId
   * @returns:string Signature
   */
  async signUserPaidTransaction(
    signUserPaidTransactionDto: SignUserPaidTransactionDto
  ): Promise<string> {
    const { chainId = this.#smartAccountConfig.activeNetworkId, tx } = signUserPaidTransactionDto
    const signatureType = this.#smartAccountConfig.signType
    const walletContract = this.contractUtils.attachWalletContract(
      chainId,
      this.DEFAULT_VERSION,
      this.address
    )
    let signature = '0x'
    if (signatureType === SignTypeMethod.PERSONAL_SIGN) {
      const { data } = await smartAccountSignMessage(this.signer, walletContract, tx, chainId)
      signature += data.slice(2)
    } else {
      const { data } = await smartAccountSignTypedData(this.signer, walletContract, tx, chainId)
      signature += data.slice(2)
    }
    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16)
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27
      signature = signature.slice(0, -2) + correctV.toString(16)
    }
    Logger.log('non-4337 flow signature: ', signature)
    return signature
  }

  // This would be a implementation on non-aa4337 provider
  /**
   * Prepares encoded wallet transaction, gets signature from the signer and dispatches to the blockchain using relayer
   * @param tx IWalletTransaction Smart Account Transaction object prepared
   * @param chainId optional chainId
   * @returns transactionId : transaction identifier
   */
  // Forward transaction // rename options: sendDirectTransactionWithFeeQuote
  async sendUserPaidTransaction(
    sendUserPaidTransactionDto: SendUserPaidTransactionDto
  ): Promise<string> {
    let { chainId } = sendUserPaidTransactionDto
    const { tx } = sendUserPaidTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    const { gasLimit } = sendUserPaidTransactionDto
    const rawTx: RawTransactionType = {
      to: tx.to,
      data: tx.data,
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

    const walletContract = this.contractUtils.attachWalletContract(
      chainId,
      this.DEFAULT_VERSION,
      this.address
    )

    const signature = await this.signUserPaidTransaction({
      version: this.DEFAULT_VERSION,
      tx,
      chainId,
      signer: this.signer
    })

    const execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.contractUtils.getSmartAccountState()
    if ( !state.isDeployed ){
    const isDeployed = await this.isDeployed(chainId)
    state.isDeployed = isDeployed
    this.contractUtils.setSmartAccountState(state)
    }
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
    } /*else {
      relayTrx.gasLimit = {
        hex: '0x16E360',
        type: 'hex'
      }
    }*/

    /*if (!isDeployed) {
      relayTrx.gasLimit = {
        hex: '0x1E8480',
        type: 'hex'
      }
    }*/
    const relayResponse: RelayResponse = await this.relayer.relay(relayTrx, this)
    if (relayResponse.transactionId) {
      return relayResponse.transactionId
    }
    return ''
  }

  // TODO: single method. can have types as aa-4337 and non-4337. can have fee modes based on types
  /*async sendSignedTransaction() {

  }*/

  async sendSignedTransactionWithFeeQuote(
    sendUserPaidSignedTransactionDto: SendUserPaidSignedTransactionDto
  ): Promise<string> {
    let { chainId } = sendUserPaidSignedTransactionDto
    const { tx, signature } = sendUserPaidSignedTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    let { gasLimit } = sendUserPaidSignedTransactionDto
    const isDeployed = await this.contractUtils.isDeployed(chainId, this.address)
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

    const walletContract = this.contractUtils.attachWalletContract(
      chainId,
      this.DEFAULT_VERSION,
      this.address
    )

    const execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.contractUtils.getSmartAccountState()
    if ( !state.isDeployed ){
      const isDeployed = await this.isDeployed(chainId)
      state.isDeployed = isDeployed
      this.contractUtils.setSmartAccountState(state)
      }

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
    Logger.log('relayResponse', relayResponse)
    if (relayResponse.transactionId) {
      return relayResponse.transactionId
    }
    return ''
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param getFeeQuotesDto
   */
  async getFeeQuotes(getFeeQuotesDto: GetFeeQuotesDto): Promise<FeeQuote[]> {
    let { version, chainId } = getFeeQuotesDto
    const { transaction } = getFeeQuotesDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    return this.transactionManager.getFeeQuotes({
      chainId,
      version,
      transaction
    })
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param getFeeQuotesForBatchDto
   */
  // TODO: rename to getFeeQuotes // can keep single method for batch and single tx
  async getFeeQuotesForBatch(
    getFeeQuotesForBatchDto: GetFeeQuotesForBatchDto
  ): Promise<FeeQuote[]> {
    let { version, chainId } = getFeeQuotesForBatchDto
    const { transactions } = getFeeQuotesForBatchDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    return this.transactionManager.getFeeQuotesForBatch({
      version,
      chainId,
      transactions
    })
  }

  // Other helpers go here for pre build (feeOptions and quotes from relayer) , build and execution of refund type transactions
  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param createUserPaidTransactionDto
   * @returns
   */
  // options : createSCWTransactionWithFeeQuote / invokeAccountWithFeeQuote / createDirectSCWTransaction
  async createUserPaidTransaction(
    createUserPaidTransactionDto: CreateUserPaidTransactionDto
  ): Promise<IWalletTransaction> {
    let { version, chainId, skipEstimation } = createUserPaidTransactionDto
    const { transaction, feeQuote } = createUserPaidTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    skipEstimation = skipEstimation ?? false
    return this.transactionManager.createUserPaidTransaction({
      version,
      transaction,
      chainId,
      feeQuote,
      skipEstimation
    })
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  async createTransaction(transactionDto: TransactionDto): Promise<IWalletTransaction> {
    let { version, chainId } = transactionDto
    const { transaction } = transactionDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    return this.transactionManager.createTransaction({ chainId, version, transaction })
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is without fee refund (gasless)
   * @param transaction
   * @param chainId
   * @returns
   */
  async createTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<IWalletTransaction> {
    let { version, chainId } = transactionBatchDto
    const { transactions } = transactionBatchDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    return this.transactionManager.createTransactionBatch({
      version,
      transactions,
      chainId
    })
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param createUserPaidTransactionBatchDto
   * @returns
   */
  async createUserPaidTransactionBatch(
    createUserPaidTransactionBatchDto: CreateUserPaidTransactionBatchDto
  ): Promise<IWalletTransaction> {
    let { version, chainId, skipEstimation } = createUserPaidTransactionBatchDto
    const { transactions, feeQuote } = createUserPaidTransactionBatchDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    skipEstimation = skipEstimation ?? false
    return this.transactionManager.createUserPaidTransactionBatch({
      version,
      transactions,
      chainId,
      feeQuote,
      skipEstimation
    })
  }

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
   * @param address EOA address
   * @param chainId optional chainId
   * @param index optional index for counterfactual address
   * @returns SmartAccount address for given EOA address
   */
  async getSmartAccountAddress(owner: string, chainId?: ChainId, index?: number): Promise<string> {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    index = index ? index : 0
    const factoryAddr = this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION]
    return await factoryAddr.getAddressForCounterFactualAccount(owner, index)
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

  // WIP
  // expose getMultiSend(), getMultiSendCall()

  async getAddress(
    addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
  ): Promise<SmartAccountState> {
    const { index, chainId, version } = addressForCounterFactualWalletDto

    // const walletInfo = await getWalletInfo({
    //   chainId,
    //   owner: this.owner,
    //   txServiceUrl: this.#smartAccountConfig.backendUrl,
    //   index
    // })

    console.log(version, index, chainId);
   
    const network = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
    if (!network) throw new Error("Could not found network")
    const smartAccountState = {
      chainId: chainId,
      version: version,
      address: this.address,
      owner: this.owner,
      isDeployed: false, // could be set as state in init
      entryPointAddress: network.entryPoint[network.entryPoint.length - 1].address,
      implementationAddress: network.wallet[network.wallet.length - 1].address,
      fallbackHandlerAddress: network.fallBackHandler[network.fallBackHandler.length - 1].address,
      factoryAddress: network.walletFactory[network.walletFactory.length - 1].address
    }

    let exist
    try {
      exist = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
      const address = await this.contractUtils.smartWalletFactoryContract[chainId][
        version
      ].getAddressForCounterFactualAccount(this.owner, index)
      this.address = address
      smartAccountState.isDeployed = await this.isDeployed(chainId)
    } catch (err) {
      Logger.log('Chain config contract not loaded ', chainId)
      const providerUrl = this.getProviderUrl(network)
      const evmManager = new EvmNetworkManager({
        ethers,
        signer: this.signer,
        provider: new ethers.providers.JsonRpcProvider(providerUrl)
      })
      const sVersionType = version as SmartAccountVersion
      const factoryContract = getSmartWalletFactoryContract(
        sVersionType,
        evmManager,
        smartAccountState.factoryAddress
      )
      const address = await factoryContract.getAddressForCounterFactualAccount(this.owner, index)
      const isDeployed = await evmManager.isContractDeployed(address)
      console.log(' isDeployed ', isDeployed)
      smartAccountState.isDeployed = isDeployed
      this.address = address
    }
    smartAccountState.address = this.address

    this.contractUtils.setSmartAccountState(smartAccountState)


    return smartAccountState
  }

  /**
   * Allows one to check if the smart account is already deployed on requested chainOd
   * @notice the check is made on Wallet Factory state with current address in Smart Account state
   * @param chainId optional chainId : Default is current active
   * @returns
   */
  async isDeployed(chainId: ChainId): Promise<boolean> {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    return await this.contractUtils.isDeployed(chainId, this.address)
  }

  /**
   * @param chainId requested chain : default is active chain
   * @returns object containing infromation (owner, relevant contract addresses, isDeployed) about Smart Account for requested chain
   */
  async getSmartAccountState(): Promise<SmartAccountState> {
    return this.contractUtils.getSmartAccountState()
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

export default SmartAccount
