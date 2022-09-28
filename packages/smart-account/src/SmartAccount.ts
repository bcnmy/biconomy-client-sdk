import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { ethers } from 'ethers'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract,
  findChainById,
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
  FeeRefundHandlePayment,
  FeeRefundV1_0_0,
  FeeRefundV1_0_1,
  WalletTransaction,
  SmartAccountVersion,
  SignedTransaction,
  ChainId,
  SmartAccountContext,
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  RawTransactionType,
  SmartAccountState,
  MetaTransactionData,
  MetaTransaction,
  OperationType,
  TokenData,
  FeeQuote,
  FeeOptionsResponse,
  ZERO_ADDRESS,
  FAKE_SIGNATURE,
  GAS_USAGE_OFFSET,
  DEFAULT_FEE_RECEIVER,
  RelayResponse,
  Config
} from '@biconomy-sdk/core-types'
import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers'
import NodeClient, {
  ChainConfig,
  SupportedChainsResponse,
  SmartAccountsResponse,
  SmartAccountByOwnerDto,
  EstimateExternalGasDto,
  EstimateRequiredTxGasDto,
  EstimateHandlePaymentTxGasDto,
  EstimateUndeployedContractGasDto
} from '@biconomy-sdk/node-client'
import { Web3Provider } from '@ethersproject/providers'
import { Relayer } from '@biconomy-sdk/relayer'
import Transaction, {
  buildSmartAccountTransaction,
  smartAccountSignMessage,
  buildMultiSendSmartAccountTx,
  encodeTransfer
} from '@biconomy-sdk/transactions'
import { GasEstimator } from './assets'
import { BalancesDto } from '@biconomy-sdk/node-client'
import {
  BalancesResponse,
  UsdBalanceResponse,
  EstimateGasResponse
} from '@biconomy-sdk/node-client'

console.log('NodeClient ', NodeClient)
console.log('Transaction ', Transaction)
// import { ContractUtils } from '@biconomy-sdk/transactions'

// Create an instance of Smart Account with multi-chain support.

// extends Transaction
class SmartAccount {
  // By default latest version
  DEFAULT_VERSION: SmartAccountVersion = '1.0.1'
  // { ethAdapter } is a window that gives access to all the implemented functions of it
  // requires signer and read-only provider
  ethAdapter!: { [chainId: number]: EthersAdapter }

  // Smart Account Context provies relevant contract instances for chainId asked (default is current active chain)
  context!: { [chainId: number]: SmartAccountContext }

  // Optional config to initialise instance of Smart Account. One can provide main active chain and only limited chains they need to be on.
  #smartAccountConfig!: Config

  // Array of chain ids that current multi-chain instance supports
  supportedNetworkIds!: ChainId[]

  // Chain configurations fetched from backend
  chainConfig!: ChainConfig[]

  // providers!:  Web3Provider[]
  provider!: Web3Provider

  signer!: JsonRpcSigner

  nodeClient!: NodeClient

  transactionInstance!: any

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

  contractUtils!: any


  // TODO
  // Review provider type WalletProviderLike / ExternalProvider
  // Can expose recommended provider classes through the SDK

  /**Constrcutor for the Smart Account. If config is not provided it makes Smart Contract available using default configuration
   * If you wish to use your own backend server and relayer service, pass the URLs here
   */
  constructor(walletProvider: Web3Provider, config: Config) {
    // super(walletProvider, config)
    this.#smartAccountConfig = { ...DefaultSmartAccountConfig }
    if (config) {
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
    }

    this.ethAdapter = {}
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds
    this.provider = walletProvider
    this.signer = walletProvider.getSigner()


    // this.transactionInstance = new Transaction(this.provider, this.#smartAccountConfig)
    // this.contractUtils = new ContractUtils()
    // this.nodeClient = new NodeClient({ txServiceUrl: this.#smartAccountConfig.backend_url })
  }

  async init(){
    this.owner = await this.signer.getAddress()
    this.#smartAccountConfig.owner = this.owner
    this.transactionInstance = new Transaction()
    await this.transactionInstance.initialize(this.provider, this.#smartAccountConfig)
    this.nodeClient = await this.transactionInstance.getNodeClient()
    this.contractUtils = await this.transactionInstance.getContractUtilInstance()
    const chainConfig = (await this.nodeClient.getAllSupportedChains()).data
    this.chainConfig = chainConfig
    this.address = await this.transactionInstance.getAddress({index: 0, chainId: this.#smartAccountConfig.activeNetworkId, version: this.DEFAULT_VERSION})
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
    this.address = await this.transactionInstance.getAddress({index: 0, chainId: this.#smartAccountConfig.activeNetworkId, version: this.DEFAULT_VERSION})
  }

  // Review :  more / other potential methods
  // sendSignedTransaction
  // signMessage

  // Discuss about multichain aspect of relayer node url and clients
  // TODO: get details from backend config
  // NOTE: Discuss about multichain aspect of relayer node url and clients


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

  public async estimateExternalGas(
    estimateExternalGasDto: EstimateExternalGasDto
  ): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateExternalGas(estimateExternalGasDto)
  }
  public async estimateRequiredTxGas(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateRequiredTxGas(estimateRequiredTxGasDto)
  }
  public async estimateRequiredTxGasOverride(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateRequiredTxGasOverride(estimateRequiredTxGasDto)
  }
  public async estimateHandlePaymentGas(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateHandlePaymentGas(estimateHandlePaymentTxGasDto)
  }
  public async estimateHandlePaymentGasOverride(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateHandlePaymentGasOverride(estimateHandlePaymentTxGasDto)
  }
  public async estimateUndeployedContractGas(estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto
  ): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateUndeployedContractGas(estimateUndeployedContractGasDto)
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
    await this.transactionInstance.setRelayer(relayer)
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
    signTransactionDto.chainId = this.#smartAccountConfig.activeNetworkId
    signTransactionDto.version = this.DEFAULT_VERSION
    signTransactionDto.signer = this.signer

    return this.transactionInstance.signTransaction(signTransactionDto)
  }

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
    prepareRefundTransactionDto.chainId = this.#smartAccountConfig.activeNetworkId
    prepareRefundTransactionDto.version = this.DEFAULT_VERSION
    prepareRefundTransactionDto.batchId = 0
    return this.transactionInstance.prepareRefundTransaction(prepareRefundTransactionDto)
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
    prepareRefundTransactionsDto.chainId = this.#smartAccountConfig.activeNetworkId
    prepareRefundTransactionsDto.version = this.DEFAULT_VERSION
    prepareRefundTransactionsDto.batchId = 0
    console.log('prepareRefundTransactionsDto ', prepareRefundTransactionsDto);
   return this.transactionInstance.prepareRefundTransactionBatch(prepareRefundTransactionsDto)
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
    refundTransactionDto.chainId = this.#smartAccountConfig.activeNetworkId
    refundTransactionDto.version = this.DEFAULT_VERSION
    refundTransactionDto.batchId = 0

    return this.transactionInstance.createRefundTransaction(refundTransactionDto)
  }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  async createTransaction(transactionDto: TransactionDto): Promise<WalletTransaction> {
    transactionDto.chainId = this.#smartAccountConfig.activeNetworkId
    transactionDto.version = this.DEFAULT_VERSION
    transactionDto.batchId = 0
    return this.transactionInstance.createTransaction(transactionDto)
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
      transactionBatchDto.chainId = this.#smartAccountConfig.activeNetworkId
      transactionBatchDto.version = this.DEFAULT_VERSION
      return this.transactionInstance.createTransactionBatch(transactionBatchDto)
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
    refundTransactionBatchDto.chainId = this.#smartAccountConfig.activeNetworkId
    refundTransactionBatchDto.version = this.DEFAULT_VERSION
    refundTransactionBatchDto.batchId = 0
    return this.transactionInstance.createRefundTransactionBatch(refundTransactionBatchDto)
  }

  async estimateSmartAccountDeployment(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<number> {
    const estimatorInterface = new ethers.utils.Interface(GasEstimator.abi);
        const walletFactoryInterface = this.factory().getInterface();
        const state = await this.getSmartAccountState();
        const encodedEstimateData = estimatorInterface.encodeFunctionData('estimate', [
          this.factory().getAddress(),
          walletFactoryInterface.encodeFunctionData('deployCounterFactualWallet', [
            state.owner,
            state.entryPointAddress,
            state.fallbackHandlerAddress,
            0
          ])
        ])
        console.log('encodedEstimate ', encodedEstimateData)
        const deployCostresponse = await this.estimateExternalGas({chainId, encodedData:encodedEstimateData});
        const estimateWalletDeployment = Number(deployCostresponse.data.gas);
        console.log('estimateWalletDeployment ', estimateWalletDeployment);
        return estimateWalletDeployment;
  }



  async prepareDeployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId) {
    return this.transactionInstance.prepareDeployAndPayFees(chainId, this.DEFAULT_VERSION)
  }
 
  // Onboarding scenario where assets inside counterfactual smart account pays for it's deployment
  async deployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId, feeQuote: FeeQuote): Promise<string> {
    const transaction = await this.transactionInstance.deployAndPayFees(chainId, this.DEFAULT_VERSION, feeQuote)
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
    // Review @talha
    const address = this.address
    smartWallet.getContract().attach(address)
    return smartWallet
  }

  /**
   *
   * @param chainId optional chainId
   * @returns Smart Wallet Factory instance for requested chainId
   */
  factory(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): SmartWalletFactoryContract {
    return this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION]
  }

  /**
   *
   * @param chainId optional chainId
   * @returns MultiSend contract instance for requested chainId
   */
  multiSend(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): MultiSendContract {
    return this.contractUtils.multiSendContract[chainId][this.DEFAULT_VERSION]
  }

  /**
   * @notice the difference between multiSend and multiSendCall
   * Multisend is only used for delegateCalls (i.e. sending off a batch of transaction from Smart account)
   * MultiSendCall is only used for calls (i.e batching Smart Account transaction with another transaction not on Smart Account)
   * @param chainId optional chainId
   * @returns MultiSend Call Only contract instance for requested chainId
   */
  multiSendCall(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): MultiSendCallOnlyContract {
    return this.contractUtils.multiSendCallOnlyContract[chainId][this.DEFAULT_VERSION]
  }


  /**
   * Allows one to check if the smart account is already deployed on requested chainOd
   * @review
   * @notice the check is made on Wallet Factory state with current address in Smart Account state
   * @param chainId optional chainId : Default is current active
   * @returns
   */
  async isDeployed(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<boolean> {
    // Other approach : needs review and might be coming wrong
    // const readProvider = new ethers.providers.JsonRpcProvider(networks[chainId].providerUrl);
    // const walletCode = await readProvider.getCode(await this.getAddress(chainId));
    // return !!walletCode && walletCode !== '0x'

    // but below works
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
    const context: SmartAccountContext = {
      baseWallet: this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION],
      walletFactory: this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION],
      multiSend: this.contractUtils.multiSendContract[chainId][this.DEFAULT_VERSION],
      multiSendCall: this.contractUtils.multiSendCallOnlyContract[chainId][this.DEFAULT_VERSION],
      // Could be added dex router for chain in the future
    }
    return context
  }
}

// Temporary default config
// TODO/NOTE : make Goerli and Mumbai as test networks and remove others
export const DefaultSmartAccountConfig: Config = {
  owner: '',
  version: '1.0.1',
  activeNetworkId: ChainId.GOERLI, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  backend_url: 'https://sdk-backend.staging.biconomy.io/v1'
}

export default SmartAccount