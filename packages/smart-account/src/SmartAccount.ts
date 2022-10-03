import EthersAdapter from '@biconomy-sdk/ethers-lib'
import {
  findContractAddressesByVersion
} from './utils/FetchContractsInfo'
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
  FeeRefundV1_0_0,
  FeeRefundV1_0_1,
  WalletTransaction,
  SmartAccountVersion,
  SignedTransaction,
  ChainId,
  SmartAccountContext,
  SmartWalletFactoryContract,
  SmartWalletContract,
  AddressForCounterFactualWalletDto,
  RawTransactionType,
  SmartAccountState,
  FeeQuote,
  RelayResponse,
  SmartAccountConfig
} from '@biconomy-sdk/core-types'
import { JsonRpcSigner } from '@ethersproject/providers'
import NodeClient, {
  ChainConfig,
  SmartAccountsResponse,
  SmartAccountByOwnerDto,
} from '@biconomy-sdk/node-client'
import { Web3Provider } from '@ethersproject/providers'
import { Relayer, RestRelayer } from '@biconomy-sdk/relayer'
import TransactionManager, { ContractUtils, smartAccountSignMessage } from '@biconomy-sdk/transactions'
import { BalancesDto } from '@biconomy-sdk/node-client'
import {
  BalancesResponse,
  UsdBalanceResponse,
} from '@biconomy-sdk/node-client'


// Create an instance of Smart Account with multi-chain support.
class SmartAccount {
  // By default latest version
  DEFAULT_VERSION: SmartAccountVersion = '1.0.1'

  // { ethAdapter } is a window that gives access to all the implemented functions of it
  // requires signer and read-only provider
  ethAdapter!: { [chainId: number]: EthersAdapter }

  // Smart Account Context provies relevant contract instances for chainId asked (default is current active chain)
  context!: { [chainId: number]: SmartAccountContext }

  // Optional config to initialise instance of Smart Account. One can provide main active chain and only limited chains they need to be on.
  #smartAccountConfig!: SmartAccountConfig

  // Array of chain ids that current multi-chain instance supports
  supportedNetworkIds!: ChainId[]

  // Chain configurations fetched from backend
  chainConfig!: ChainConfig[]
  
  // Can maintain it's own version of provider / providers
  provider!: Web3Provider

  // Ideally not JsonRpcSigner but extended signer // Also the original EOA signer
  signer!: JsonRpcSigner
  // We may have different signer for ERC4337

  nodeClient!: NodeClient

  contractUtils!: ContractUtils

  // TBD : Do we keep manager for both SCW(forward) and Account Abstraction?
  transactionManager!: TransactionManager

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

  // Review provider type WalletProviderLike / ExternalProvider
  // Can expose recommended provider classes through the SDK

  /**
   * Constrcutor for the Smart Account. If config is not provided it makes Smart Account available using default configuration
   * If you wish to use your own backend server and relayer service, pass the URLs here
   */
  // review SmartAccountConfig
  constructor(walletProvider: Web3Provider, config: SmartAccountConfig) {
    this.#smartAccountConfig = { ...DefaultSmartAccountConfig }
    if (config) {
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
    }

    this.ethAdapter = {}
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds

    this.provider = walletProvider
    this.signer = walletProvider.getSigner()

    this.contractUtils = new ContractUtils()
    this.nodeClient = new NodeClient({ txServiceUrl: this.#smartAccountConfig.backend_url })
    this.relayer = new RestRelayer({url: this.#smartAccountConfig.relayer_url});
  }

  async init(){

    this.setActiveChain(this.#smartAccountConfig.activeNetworkId)

    this.owner = await this.signer.getAddress()
    
    const chainConfig = (await this.nodeClient.getAllSupportedChains()).data
    this.chainConfig = chainConfig

    await this.contractUtils.initialize(chainConfig, this.signer)

    this.address = await this.getAddress({index: 0, chainId: this.#smartAccountConfig.activeNetworkId, version: this.DEFAULT_VERSION})

    this.transactionManager = new TransactionManager()

    const state = await this.getSmartAccountState(this.#smartAccountConfig.activeNetworkId)

    await this.transactionManager.initialize(this.relayer, this.nodeClient, this.contractUtils, state)

    return this
  }

  /**
   *
   * @param smartAccountVersion
   * @description // set wallet version to be able to interact with different deployed versions
   */
  // TODO //@review @Talha
  async setSmartAccountVersion(smartAccountVersion: SmartAccountVersion) {
    this.DEFAULT_VERSION = smartAccountVersion
    this.address = await this.getAddress({index: 0, chainId: this.#smartAccountConfig.activeNetworkId, version: this.DEFAULT_VERSION})
  }

  public async getAlltokenBalances(
    balancesDto: BalancesDto,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<BalancesResponse> {
    if (!balancesDto.chainId) balancesDto.chainId = chainId
    return this.nodeClient.getAlltokenBalances(balancesDto)
  }

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

  // return adapter instance to be used for blockchain interactions
  /**
   * adapter instance to be used for some blockchain interactions
   * @param chainId requested chainId : default is current active chain
   * @returns EthersAdapter
   */
  ethersAdapter(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): EthersAdapter {
    return this.ethAdapter[chainId]
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
  setActiveChain(chainId: ChainId): SmartAccount {
    this.#smartAccountConfig.activeNetworkId = chainId
    return this
  }


  /**
   *
   * @notice personal sign is used currently (// @todo Signer should be able to use _typedSignData)
   * @param tx WalletTransaction Smart Account Transaction object prepared
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
   * @param tx WalletTransaction Smart Account Transaction object prepared
   * @param batchId optional nonce space for parallel processing
   * @param chainId optional chainId
   * @returns
   */
   async sendTransaction(sendTransactionDto: SendTransactionDto): Promise<string> {
    const {
      tx,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = sendTransactionDto
    let  { gasLimit } = sendTransactionDto
    const isDeployed = await this.isDeployed(chainId);
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

    const refundInfo: FeeRefundV1_0_0 | FeeRefundV1_0_1 = {
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      tokenGasPriceFactor: tx.tokenGasPriceFactor,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver
    }

    let walletContract = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    walletContract = walletContract.attach(this.address)

    let signature = await this.signTransaction({ version: this.DEFAULT_VERSION, tx, chainId, signer: this.signer })

    let execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      batchId,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.getSmartAccountState(chainId)

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
    if(gasLimit) {
      relayTrx.gasLimit = gasLimit;
    }
    if(!isDeployed) {
      gasLimit = {
        hex: '0x1E8480',
        type: 'hex'
      }
    relayTrx.gasLimit = gasLimit;
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
    // TODO
    // Review @Talha
    // Note : If you have provided a chainId in dto then that should be used and fallback to activer chain Id
    const chainId = this.#smartAccountConfig.activeNetworkId
    prepareRefundTransactionDto.chainId = chainId
    prepareRefundTransactionDto.version = this.DEFAULT_VERSION
    prepareRefundTransactionDto.batchId = 0
    return this.transactionManager.prepareRefundTransaction(prepareRefundTransactionDto)
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
    const chainId = this.#smartAccountConfig.activeNetworkId
    prepareRefundTransactionsDto.chainId = chainId
    prepareRefundTransactionsDto.version = this.DEFAULT_VERSION
    prepareRefundTransactionsDto.batchId = 0
    console.log('prepareRefundTransactionsDto ', prepareRefundTransactionsDto);
   return this.transactionManager.prepareRefundTransactionBatch(prepareRefundTransactionsDto)
  }

  // Other helpers go here for pre build (feeOptions and quotes from relayer) , build and execution of refund type transactions

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param refundTransactionDto
   * @returns
   */
  async createRefundTransaction(
    refundTransactionDto: RefundTransactionDto
  ): Promise<WalletTransaction> {
    const chainId = this.#smartAccountConfig.activeNetworkId
    refundTransactionDto.chainId = chainId
    refundTransactionDto.version = this.DEFAULT_VERSION
    refundTransactionDto.batchId = 0
    return this.transactionManager.createRefundTransaction(refundTransactionDto)
  }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  async createTransaction(transactionDto: TransactionDto): Promise<WalletTransaction> {
    const chainId = this.#smartAccountConfig.activeNetworkId
    transactionDto.chainId = chainId
    transactionDto.version = this.DEFAULT_VERSION
    transactionDto.batchId = 0
    return this.transactionManager.createTransaction(transactionDto)
  }

    /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Write test case and limit batch size based on test results in scw-contracts
   * @notice This transaction is without fee refund (gasless)
   * @param transaction
   * @param batchId
   * @param chainId
   * @returns
   */
     async createTransactionBatch(
      transactionBatchDto: TransactionBatchDto
    ): Promise<WalletTransaction> {
      const chainId = this.#smartAccountConfig.activeNetworkId
      transactionBatchDto.chainId = chainId
      transactionBatchDto.version = this.DEFAULT_VERSION
      return this.transactionManager.createTransactionBatch(transactionBatchDto)
    }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param refundTransactionBatchDto
   * @returns
   */
  async createRefundTransactionBatch(
    refundTransactionBatchDto: RefundTransactionBatchDto
  ): Promise<WalletTransaction> {
    const chainId = this.#smartAccountConfig.activeNetworkId
    refundTransactionBatchDto.chainId = chainId
    refundTransactionBatchDto.version = this.DEFAULT_VERSION
    refundTransactionBatchDto.batchId = 0
    return this.transactionManager.createRefundTransactionBatch(refundTransactionBatchDto)
  }

  async prepareDeployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId) {
    return this.transactionManager.prepareDeployAndPayFees(chainId, this.DEFAULT_VERSION)
  }
 
  // Onboarding scenario where assets inside counterfactual smart account pays for it's deployment
  async deployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId, feeQuote: FeeQuote): Promise<string> {
    const transaction = await this.transactionManager.deployAndPayFees(chainId, this.DEFAULT_VERSION, feeQuote)
    const txHash = await this.sendTransaction({tx:transaction});
    return txHash;    
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

  // Note: expose getMultiSend(), getMultiSendCall() 
  

  // TODO  
  // Note: get Address method should not be here as we are passing smart account state
  // Marked for deletion
  async getAddress(
    addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
  ): Promise<string> {
    // TODO: Get from node client first from cache, if not found then query smart contract
    const { index, chainId, version } = addressForCounterFactualWalletDto
    this.contractUtils.smartWalletFactoryContract[chainId][
      version
    ].getAddressForCounterfactualWallet(this.owner, index)
    const address = await this.contractUtils.smartWalletFactoryContract[chainId][version].getAddressForCounterfactualWallet(this.owner, index)
    this.address = address
    return address
  }

    // Could be part of SmartAccountAPI for AA 
    /*async getAddressForCounterfactualWallet(
      addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
    ): Promise<string> {
      const { index, chainId, version } = addressForCounterFactualWalletDto
      console.log('index and ChainId ', index, chainId, version)
      return this.contractUtils.smartWalletFactoryContract[chainId][
        version
      ].getAddressForCounterfactualWallet(this.owner, index)
    }*/


  /**
   * Allows one to check if the smart account is already deployed on requested chainOd
   * @review
   * @notice the check is made on Wallet Factory state with current address in Smart Account state
   * @param chainId optional chainId : Default is current active
   * @returns
   */
  async isDeployed(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<boolean> {
    // Other approach : needs review
    /*let isPhantom = false
    // could be readProvider.getCode
    const walletAddressCode = await this.provider.getCode(this.address)
    if (walletAddressCode.length > 2) {
      isPhantom = true
    } 
    return isPhantom;*/

    //Below works
    return await this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION].isWalletExist(this.address)
  }

  /**
   * @review for owner
   * @param chainId requested chain : default is active chain
   * @returns object containing infromation (owner, relevant contract addresses, isDeployed) about Smart Account for requested chain
   */
  async getSmartAccountState(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<SmartAccountState> {
    const contractsByVersion = findContractAddressesByVersion(
      this.DEFAULT_VERSION,
      chainId,
      this.chainConfig
    )

    const state: SmartAccountState = {
      address: this.address,
      owner: this.owner,
      isDeployed: await this.isDeployed(chainId), // could be set as state in init
      entryPointAddress: contractsByVersion.entryPointAddress || '',
      fallbackHandlerAddress: contractsByVersion.fallBackHandlerAddress || ''
    }
    return state
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
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): SmartAccountContext {
    const context: SmartAccountContext = this.contractUtils.getSmartAccountContext(chainId, this.DEFAULT_VERSION)
    return context
  }
}

// Temporary default config
// TODO/NOTE : make Goerli and Mumbai as test networks and remove others
export const DefaultSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.GOERLI, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  backend_url: 'https://sdk-backend.staging.biconomy.io/v1',
  relayer_url: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay'
}

export default SmartAccount