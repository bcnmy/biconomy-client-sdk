import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { findContractAddressesByVersion } from './utils/FetchContractsInfo'
import {
  SignTransactionDto,
  SendTransactionDto,
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
  IMetaTransaction
} from '@biconomy-sdk/core-types'
import NodeClient, {
  ProviderUrlConfig,
  ChainConfig,
  SmartAccountsResponse,
  SmartAccountByOwnerDto
} from '@biconomy-sdk/node-client'
import { Web3Provider } from '@ethersproject/providers'
import { Relayer, RestRelayer } from '@biconomy-sdk/relayer'
import EvmNetworkManager from '@biconomy-sdk/ethers-lib'

import TransactionManager, {
  ContractUtils,
  smartAccountSignMessage
} from '@biconomy-sdk/transactions'

import { BalancesDto } from '@biconomy-sdk/node-client'
import {
  SCWTransactionResponse,
  BalancesResponse,
  UsdBalanceResponse
} from '@biconomy-sdk/node-client'

import { TransactionResponse } from '@ethersproject/providers'

import { JsonRpcProvider } from '@ethersproject/providers'

// AA
import { newProvider, ERC4337EthersProvider } from '@biconomy-sdk/account-abstraction'
import { ethers, Signer } from 'ethers'


// function Confirmable() {
//   return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
//     console.log('target ', target)
//     console.log('key ', key)
//     console.log('descriptor ', descriptor)
//     const original = descriptor.value;

//       descriptor.value = function( ... args: any[]) {
//         console.log('args ', args)
//         args[0].chainId = 1
//         const result = original.apply(this, args);
//         return result;
//     };

//     return descriptor;
//   };
// }

// Create an instance of Smart Account with multi-chain support.
class SmartAccount {
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

  providerUrlConfig!: ProviderUrlConfig[]

  provider!: Web3Provider

  // 4337Provider
  aaProvider!: { [chainId: number]: ERC4337EthersProvider }

  // Ideally not JsonRpcSigner but extended signer // Also the original EOA signer
  signer!: Signer
  // We may have different signer for ERC4337

  nodeClient!: NodeClient

  contractUtils!: ContractUtils

  // TBD : Do we keep manager for both SCW(forward) and Account Abstraction?
  transactionManager!: TransactionManager
  // aaTransactionManager

  // Instance of relayer (Relayer Service Client) connected with this Smart Account and always ready to dispatch transactions
  // relayer.relay => dispatch to blockchain
  // other methods are useful for the widget
  relayer!: Relayer

  // Owner of the Smart Account common between all chains
  // Could be part of Smart Account state / config
  // @review with Sachin
  owner!: string

  // Address of the smart contract wallet common between all chains
  // @review
  address!: string

  dappAPIKey!: string

  smartAccountState!: SmartAccountState

  // TODO
  // Review provider type WalletProviderLike / ExternalProvider
  // Can expose recommended provider classes through the SDK

  /**
   * Constrcutor for the Smart Account. If config is not provided it makes Smart Account available using default configuration
   * If you wish to use your own backend server and relayer service, pass the URLs here
   */
  // review SmartAccountConfig
  // TODO : EOA signer instead of { walletProvider }
  // TODO : We Need to take EntryPoint | Paymaster | bundlerUrl address as optional ?
  // TODO: May be need to manage separate config for Forward and gasless Flow

  /**
    Scw-Refund-Flow -- config
  prepareRefundTransactionBatch
  createRefundTransactionBatch
  sendTransaction
   */

  /**
   GassLess Flow -- config
   sendGaslessTransaction
   */
  constructor(walletProvider: Web3Provider, config?: Partial<SmartAccountConfig>) {
    this.#smartAccountConfig = { ...DefaultSmartAccountConfig }

    // if ( !this.#smartAccountConfig.activeNetworkId ){
    //   throw Error('active chain needs to be specified')
    // }

    // if ( this.#smartAccountConfig.supportedNetworksIds.length == 0 )
    // this.#smartAccountConfig.supportedNetworksIds = [this.#smartAccountConfig.activeNetworkId]

    if (config) {
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
    }
    // Useful for AA flow. Check if it is valid key
    this.dappAPIKey = this.#smartAccountConfig.dappAPIKey || ''
    // Useful if Dapp needs custom RPC Urls. Check if valid. Fallback to public Urls
    this.providerUrlConfig = this.#smartAccountConfig.providerUrlConfig || []
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds

    // Should not break if we make this wallet connected provider optional (We'd have JsonRpcProvider / JsonRpcSender)
    this.provider = walletProvider
    this.signer = walletProvider.getSigner()
    // Refer to SmartAccountSigner from eth-bogota branch

    this.nodeClient = new NodeClient({ txServiceUrl: this.#smartAccountConfig.backend_url })
    this.relayer = new RestRelayer({ url: this.#smartAccountConfig.relayer_url })
    this.aaProvider = {}
    this.chainConfig = []
  }

  getProviderUrl(network: ChainConfig): string {
    let providerUrl =
      this.#smartAccountConfig.providerUrlConfig?.find(
        (element) => element.chainId === network.chainId
      )?.providerUrl || ''

    if (!providerUrl) providerUrl = network.providerUrl
    return providerUrl
  }

  async initializeContractsAtChain(chainId: ChainId) {
    let exist
    try {
      exist = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    } catch (err) {
      console.log('Instantiating chain ', chainId)
    }
    if (!exist) {
      const network = this.chainConfig.find((element: ChainConfig) => element.chainId === chainId)
      if (!network) return
      const providerUrl = this.getProviderUrl(network)
      const readProvider = new ethers.providers.JsonRpcProvider(providerUrl)
      await this.contractUtils.initializeContracts(this.signer, readProvider, network)

      if (!this.address){
        this.address = await this.getAddress({
          index: 0,
          chainId: network.chainId,
          version: this.DEFAULT_VERSION
        })
        console.log('smart wallet address is ', this.address)

        this.smartAccountState = {
          chainId: network.chainId,
          version: this.DEFAULT_VERSION,
          address: this.address,
          owner: this.owner,
          isDeployed: await this.contractUtils.isDeployed(network.chainId, this.DEFAULT_VERSION, this.address), // could be set as state in init
          entryPointAddress: network.fallBackHandler[network.fallBackHandler.length - 1].address,
          fallbackHandlerAddress: network.walletFactory[network.walletFactory.length - 1].address
        }
      }

      this.aaProvider[network.chainId] = await newProvider(
        new ethers.providers.JsonRpcProvider(providerUrl),
        {
          dappId: this.dappAPIKey,
          signingServiceUrl: this.#smartAccountConfig.signingServiceUrl,
          paymasterAddress: this.#smartAccountConfig.paymasterAddress || '',
          entryPointAddress: this.#smartAccountConfig.entryPointAddress
            ? this.#smartAccountConfig.entryPointAddress
            : network.entryPoint[network.entryPoint.length - 1].address,
          bundlerUrl: this.#smartAccountConfig.bundlerUrl || '',
          chainId: network.chainId
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

    this.contractUtils = new ContractUtils(this.DEFAULT_VERSION, chainConfig)

    for (let index = 0; index < this.#smartAccountConfig.supportedNetworksIds.length; index++) {
      const network = chainConfig.find(
        (element: ChainConfig) =>
          element.chainId === this.#smartAccountConfig.activeNetworkId
      )
      if (network) {
        this.chainConfig.push(network)
      }
    }
    await this.initializeContractsAtChain(this.#smartAccountConfig.activeNetworkId)


    this.transactionManager = new TransactionManager(this.smartAccountState)

    await this.transactionManager.initialize(
      this.relayer,
      this.nodeClient,
      this.contractUtils
    )
    console.log('aa provider ', this.aaProvider)
    console.log('hurrahhh ----- initilization completed')
    return this
  }

  // TODO
  // Optional methods for connecting paymaster
  // Optional methods for connecting another bundler

  public async sendGasLessTransaction(
    transactionDto: TransactionDto
  ): Promise<TransactionResponse> {
    let { version, transaction, chainId } = transactionDto

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    const aaSigner = this.aaProvider[this.#smartAccountConfig.activeNetworkId].getSigner()

    // await this.initializeContractsAtChain(chainId)

    // const state = await this.contractUtils.getSmartAccountState(this.smartAccountState)

    // let customData: Record<string, any> = {
    //   isDeployed: state.isDeployed,
    //   skipGasLimit: false,
    //   isBatchedToMultiSend: false,
    //   appliedGasLimit: 500000 // could come from params or local mock estimation..
    // }

    // const multiSendContract = this.contractUtils.multiSendContract[chainId][version].getContract()
    // if (
    //   ethers.utils.getAddress(transaction.to) === ethers.utils.getAddress(multiSendContract.address)
    // ) {
    //   customData.skipGasLimit = true
    //   customData.isBatchedToMultiSend = true
    // }

    const response = await aaSigner.sendTransaction(transaction)
    return response
    // todo: make sense of this response and return hash to the user
  }

  public async sendGaslessTransactionBatch(transactionBatchDto: TransactionBatchDto): Promise<TransactionResponse> {
    let { version, transactions, batchId, chainId } = transactionBatchDto

    // Might get optional operation for tx

    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    version = version ? version : this.DEFAULT_VERSION
    batchId = batchId ? batchId : 0

    // NOTE : If the wallet is not deployed yet then nonce would be zero
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
    console.log('final gasless batch tx ')
    console.log(finalTx)

    const gaslessTx = {
      to: finalTx.to,
      data: finalTx.data,
      value: finalTx.value
    }

    // Multisend is tricky because populateTransaction expects delegateCall and we must override

    // Review : Stuff before this can be moved to TransactionManager
    const response = await this.sendGasLessTransaction({ version, transaction: gaslessTx, chainId })
    return response
  }

  // Only to deploy wallet using connected paymaster (or the one corresponding to dapp api key)
  // Todo Chirag 
  // Add return type
  // Review involvement of Dapp API Key
  public async deployWalletUsingPaymaster() {
    // can pass chainId
    const aaSigner = this.aaProvider[this.#smartAccountConfig.activeNetworkId].getSigner()
    const response = await aaSigner.deployWalletOnly()
    // todo: make sense of this response and return hash to the user
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

  // Todo Chirag 
  // Review inputs as chainId is already part of Dto
  public async getAlltokenBalances(
    balancesDto: BalancesDto,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<BalancesResponse> {
    if (!balancesDto.chainId) balancesDto.chainId = chainId
    return this.nodeClient.getAlltokenBalances(balancesDto)
  }

  // Todo Chirag 
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

  // @Talha to add description for this
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
  async setRelayer(relayer: Relayer): Promise<SmartAccount> {
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
    let walletContract = this.smartAccount(chainId).getContract()
    walletContract = walletContract.attach(this.address)
    // TODO - rename and organize utils
    const { signer, data } = await smartAccountSignMessage(this.signer, walletContract, tx, chainId)
    let signature = '0x'
    signature += data.slice(2)
    return signature
    // return this.signer.signTransaction(signTransactionDto)
  }

  // This would be a implementation on user sponsorship provider
  /**
   * Prepares encoded wallet transaction, gets signature from the signer and dispatches to the blockchain using relayer
   * @param tx IWalletTransaction Smart Account Transaction object prepared
   * @param batchId optional nonce space for parallel processing
   * @param chainId optional chainId
   * @returns
   */
  async sendTransaction(sendTransactionDto: SendTransactionDto): Promise<string> {
    let {
      tx,
      batchId = 0,
      chainId
    } = sendTransactionDto
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
    let { gasLimit } = sendTransactionDto
    const isDeployed = await this.contractUtils.isDeployed(chainId, this.DEFAULT_VERSION, this.address)
    let rawTx: RawTransactionType = {
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

    let signature = await this.signTransaction({
      version: this.DEFAULT_VERSION,
      tx,
      chainId,
      signer: this.signer
    })

    let execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      batchId,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.contractUtils.getSmartAccountState(this.smartAccountState)

    const signedTx: SignedTransaction = {
      rawTx,
      tx
    }
    const relayTrx: RelayTransaction = {
      signedTx,
      config: state,
      context: this.getSmartAccountContext(chainId)
    }
    // Must be in specified format
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
    const txn: RelayResponse = await this.relayer.relay(relayTrx)
    return txn.hash
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
    let { version, transaction, batchId, chainId } = prepareRefundTransactionDto
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
    let { version, transactions, batchId, chainId } = prepareRefundTransactionsDto

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
    let { version, transaction, batchId, feeQuote, chainId } = refundTransactionDto
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
  async createTransaction(transactionDto: TransactionDto): Promise<IWalletTransaction> {
    let { version, transaction, batchId, chainId } = transactionDto

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
  async createTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<IWalletTransaction> {
    let { version, transactions, batchId, chainId } = transactionBatchDto

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
    let { version, transactions, batchId, feeQuote, chainId } = refundTransactionBatchDto
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

  // todo : chirag missing return type
  async prepareDeployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId) {
    return this.transactionManager.prepareDeployAndPayFees(chainId, this.DEFAULT_VERSION)
  }

  // Onboarding scenario where assets inside counterfactual smart account pays for it's deployment
  async deployAndPayFees(
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId,
    feeQuote: FeeQuote
  ): Promise<string> {
    const transaction = await this.transactionManager.deployAndPayFees(
      chainId,
      this.DEFAULT_VERSION,
      feeQuote
    )
    const txHash = await this.sendTransaction({ tx: transaction })
    return txHash
  }


  /**
   *
   * @param chainId optional chainId
   * @returns Smart Wallet Contract instance attached with current smart account address (proxy)
   */
  smartAccount(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletContract {
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
  factory(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletFactoryContract {
    return this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION]
  }

  multiSend(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): MultiSendContract {
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
     async getSmartAccountState(
      chainId: ChainId
    ): Promise<SmartAccountState> {

      chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId
      return this.contractUtils.getSmartAccountState(this.smartAccountState)
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
    chainId: ChainId
  ): SmartAccountContext {
    chainId = chainId ? chainId : this.#smartAccountConfig.activeNetworkId

    const context: SmartAccountContext = this.contractUtils.getSmartAccountContext(
      chainId,
      this.DEFAULT_VERSION
    )
    return context
  }
}

// Temporary default config
// TODO/NOTE : make Goerli and Mumbai as test networks and remove others
export const DefaultSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.GOERLI, //Update later
  paymasterAddress: '0x50e8996670759E1FAA315eeaCcEfe0c0A043aA51',
  signingServiceUrl: 'https://us-central1-biconomy-staging.cloudfunctions.net',
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  backend_url: 'https://sdk-backend.staging.biconomy.io/v1',
  relayer_url: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
  dappAPIKey: 'PMO3rOHIu.5eabcc5d-df35-4d37-93ff-502d6ce7a5d6',
  bundlerUrl: 'http://localhost:3000/rpc',
  providerUrlConfig: [   // TODO: Define Type For It
    {
      chainId: ChainId.GOERLI,
      providerUrl: 'https://eth-goerli.alchemyapi.io/v2/lmW2og_aq-OXWKYRoRu-X6Yl6wDQYt_2'
    },
    {
      chainId: ChainId.POLYGON_MUMBAI,
      providerUrl: 'https://polygon-mumbai.g.alchemy.com/v2/Q4WqQVxhEEmBYREX22xfsS2-s5EXWD31'
    }
  ]
}

export default SmartAccount
