import { SmartAccountConfig } from './types'
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
  AddressForCounterFactualWalletDto,
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
  FeeRefundV1_0_6,
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
  RelayResponse
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
import {
  buildSmartAccountTransaction,
  smartAccountSignMessage,
  buildMultiSendSmartAccountTx,
  // WalletTransaction,
  // ExecTransaction,
  // MetaTransaction, 
  // buildMultiSendSmartAccountTx
} from '@biconomy-sdk/transactions'
import { encodeTransfer } from '@biconomy-sdk/transactions'
import { GasEstimator } from './assets'
import { BalancesDto } from '@biconomy-sdk/node-client'
import {
  BalancesResponse,
  UsdBalanceResponse,
  EstimateGasResponse
} from '@biconomy-sdk/node-client'

// Create an instance of Smart Account with multi-chain support.
class SmartAccount {
  // By default latest version
  DEFAULT_VERSION: SmartAccountVersion = '1.0.6'
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

  // providers!:  Web3Provider[]
  provider!: Web3Provider

  signer!: JsonRpcSigner

  nodeClient!: NodeClient

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

  // contract instances
  smartWalletContract!: { [chainId: number]: { [version: string]: SmartWalletContract } }
  multiSendContract!: { [chainId: number]: { [version: string]: MultiSendContract } }
  multiSendCallOnlyContract!: {
    [chainId: number]: { [version: string]: MultiSendCallOnlyContract }
  }
  smartWalletFactoryContract!: {
    [chainId: number]: { [version: string]: SmartWalletFactoryContract }
  }

  // TODO
  // Review provider type WalletProviderLike / ExternalProvider
  // Can expose recommended provider classes through the SDK

  /**Constrcutor for the Smart Account. If config is not provided it makes Smart Contract available using default configuration
   * If you wish to use your own backend server and relayer service, pass the URLs here
   */
  constructor(walletProvider: Web3Provider, config?: Partial<SmartAccountConfig>) {
    this.#smartAccountConfig = { ...DefaultSmartAccountConfig }
    if (config) {
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
    }

    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.multiSendCallOnlyContract = {}
    this.smartWalletFactoryContract = {}
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds
    this.provider = walletProvider
    this.signer = walletProvider.getSigner()

    this.nodeClient = new NodeClient({ txServiceUrl: this.#smartAccountConfig.backend_url })
  }

  /**
   *
   * @param smartAccountVersion
   * @description // set wallet version to be able to interact with different deployed versions
   */
  // TODO //@review @Talha
  async setSmartAccountVersion(smartAccountVersion: SmartAccountVersion) {
    this.DEFAULT_VERSION = smartAccountVersion
    this.address = await this.getAddress()
  }

  // TODO
  // add a flag initialised which gets checked before calling other functions

  /**
   *
   * @returns this/self - instance of SmartAccount
   */
  public async init(): Promise<SmartAccount> {
    const chainConfig = (await this.getSupportedChainsInfo()).data
    this.chainConfig = chainConfig
    // console.log("chain config: ", chainConfig);

    const signer = this.signer
    // (check usage of getsignerByAddress from mexa/sdk and playground)

    for (let i = 0; i < this.supportedNetworkIds.length; i++) {
      const network = this.supportedNetworkIds[i]
      const providerUrl = chainConfig.find((n) => n.chainId === network)?.providerUrl
      // To keep it network agnostic
      // Note: think about events when signer needs to pay gas

      const readProvider = new ethers.providers.JsonRpcProvider(providerUrl)
      // Instantiating EthersAdapter instance and maintain it as above mentioned class level variable
      this.ethAdapter[network] = new EthersAdapter({
        ethers,
        signer,
        provider: readProvider
      })

      this.smartWalletFactoryContract[network] = {}
      this.smartWalletContract[network] = {}
      this.multiSendContract[network] = {}
      this.multiSendCallOnlyContract[network] = {}
      this.initializeContracts(network)
    }
    // We set the common owner by quering default active chainId ethAdapter
    this.owner = await this.ethersAdapter().getSignerAddress()
    // @review
    // Smart Account addresses gets set by querying active chain's wallet factory (along with owner and index = 0)
    this.address = await this.getAddress()
    return this
  }

  // Intialize contracts to be used throughout this class
  private initializeContracts(chainId: ChainId) {
    // We get the addresses using chainConfig fetched from backend node
    const currentChainInfo: ChainConfig = findChainById(chainId, this.chainConfig)

    const smartWallet = currentChainInfo.wallet
    const smartWalletFactoryAddress = currentChainInfo.walletFactory
    const multiSend = currentChainInfo.multiSend
    const multiSendCall = currentChainInfo.multiSendCall
    for (let index = 0; index < smartWallet.length; index++) {
      const version = smartWallet[index].version
      console.log(smartWallet[index])

      this.smartWalletFactoryContract[chainId][version] = getSmartWalletFactoryContract(
        version,
        this.ethAdapter[chainId],
        smartWalletFactoryAddress[index].address
      )
      // NOTE/TODO : attached address is not wallet address yet
      this.smartWalletContract[chainId][version] = getSmartWalletContract(
        version,
        this.ethAdapter[chainId],
        smartWallet[index].address
      )

      this.multiSendContract[chainId][version] = getMultiSendContract(
        version,
        this.ethAdapter[chainId],
        multiSend[index].address
      )

      this.multiSendCallOnlyContract[chainId][version] = getMultiSendCallOnlyContract(
        version,
        this.ethAdapter[chainId],
        multiSendCall[index].address
      )
    }
  }

  // Review :  more / other potential methods
  // sendSignedTransaction
  // signMessage

  // Discuss about multichain aspect of relayer node url and clients
  // TODO: get details from backend config
  // NOTE: Discuss about multichain aspect of relayer node url and clients

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
   */
  private async getAddressForCounterfactualWallet(
    addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
  ): Promise<string> {
    const { index = 0, chainId = this.#smartAccountConfig.activeNetworkId } =
      addressForCounterFactualWalletDto
    console.log('index and ChainId ', index, chainId, this.DEFAULT_VERSION)    
    return this.smartWalletFactoryContract[chainId][
      this.DEFAULT_VERSION
    ].getAddressForCounterfactualWallet(this.owner, index)
  }

  /**
   * Fetch supported chainInfo from backend node : used in init
   * @returns ChainConfig response received from backend node
   */
  private async getSupportedChainsInfo(): Promise<SupportedChainsResponse> {
    return this.nodeClient.getAllSupportedChains()
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
  setRelayer(relayer: Relayer): SmartAccount {
    if (relayer === undefined) return this
    this.relayer = relayer
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
    let gasLimit;
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

    const refundInfo: FeeRefundV1_0_0 | FeeRefundV1_0_6 = {
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      tokenGasPriceFactor: tx.tokenGasPriceFactor,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver
    }

    let walletContract = this.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    walletContract = walletContract.attach(this.address)

    let signature = await this.signTransaction({ tx, chainId })

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
    const {
      transaction,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = prepareRefundTransactionDto

    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)
    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response
    let feeQuotes: Array<FeeQuote> = []

    // 1. If wallet is deployed
    // 2. If wallet is not deployed (batch wallet deployment on multisend)
    // actual estimation with dummy sig
    // eth_call to rescue : undeployed /deployed wallet with override bytecode SmartWalletNoAuth
    const estimatedGasUsed: number = await this.estimateTransaction({
      transaction,
      batchId,
      chainId
    })

    // also relayer would give feeReceiver that becomes part of feeQuote

    feeOptionsAvailable.forEach((feeOption) => {
      const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0
      const offset = feeOption.offset || 1
      let payment = tokenGasPrice * (estimatedGasUsed + feeTokenTransferGas) / offset;

      let feeQuote = {
        symbol: feeOption.symbol,
        address: feeOption.address,
        decimal: feeOption.decimal,
        logoUrl: feeOption.logoUrl,
        tokenGasPrice: feeOption.tokenGasPrice,
        offset: feeOption.offset,
        payment: payment,
        refundReceiver: feeOption.refundReceiver
      }

      feeQuotes.push(feeQuote)
    })

    return feeQuotes
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param prepareRefundTransactionsDto
   */
  async prepareRefundTransactionBatch(
    prepareRefundTransactionsDto: PrepareRefundTransactionsDto
  ): Promise<FeeQuote[]> {
    const {
      transactions,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = prepareRefundTransactionsDto
    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)
    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response
    let feeQuotes: Array<FeeQuote> = []

    // 1. If wallet is deployed
    // 2. If wallet is not deployed (batch wallet deployment on multisend)
    // actual estimation with dummy sig
    // eth_call to rescue : undeployed /deployed wallet with override bytecode SmartWalletNoAuth
    const estimatedGasUsed: number = await this.estimateTransactionBatch({
      transactions,
      batchId,
      chainId
    })

    feeOptionsAvailable.forEach((feeOption) => {
      const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0
      const offset = feeOption.offset || 1
      let payment = tokenGasPrice * (estimatedGasUsed + feeTokenTransferGas) / offset;

      let feeQuote = {
        symbol: feeOption.symbol,
        address: feeOption.address,
        decimal: feeOption.decimal,
        logoUrl: feeOption.logoUrl,
        tokenGasPrice: feeOption.tokenGasPrice,
        offset: feeOption.offset,
        payment: payment,
        refundReceiver: feeOption.refundReceiver
      }

      feeQuotes.push(feeQuote)
    })

    return feeQuotes
  }

  async estimateTransactionBatch( prepareRefundTransactionsDto: PrepareRefundTransactionsDto): Promise<number> {

    const { transactions, batchId = 0, chainId = this.#smartAccountConfig.activeNetworkId } = prepareRefundTransactionsDto
      let estimatedGasUsed = 0;
      // Check if available from current state
      const isDeployed = await this.isDeployed(chainId);
      if (!isDeployed) {
        const estimateWalletDeployment = await this.estimateSmartAccountDeployment(chainId);
        console.log('estimateWalletDeployment ', estimateWalletDeployment);
        estimatedGasUsed += estimateWalletDeployment;
      }

      const tx = await this.createTransactionBatch({ transactions, batchId, chainId});

      const txn: ExecTransaction = {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        operation: tx.operation,
        targetTxGas: tx.targetTxGas
      }

      // to avoid failing eth_call override with undeployed wallet
      txn.targetTxGas = 500000;
  
      const refundInfo: FeeRefundV1_0_6 = {
        baseGas: tx.baseGas,
        gasPrice: tx.gasPrice,
        tokenGasPriceFactor: tx.tokenGasPriceFactor,
        gasToken: tx.gasToken,
        refundReceiver: tx.refundReceiver
      }

      const estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto = {
        chainId,
        transaction: txn,
        walletAddress: this.address,
        feeRefund: refundInfo,
        signature: FAKE_SIGNATURE
      }

      const ethCallOverrideResponse = await this.estimateUndeployedContractGas(estimateUndeployedContractGasDto);
      let noAuthEstimate = Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas);
      console.log('no auth no refund estimate', noAuthEstimate);

      estimatedGasUsed += noAuthEstimate;

      return estimatedGasUsed;
    }

  async estimateTransaction(prepareTransactionDto: PrepareRefundTransactionDto): Promise<number> {
    const {
      transaction,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = prepareTransactionDto

    let estimatedGasUsed = 0;
      // Check if available from current state
      const isDeployed = await this.isDeployed(chainId);
      if (!isDeployed) {
        const estimateWalletDeployment = await this.estimateSmartAccountDeployment(chainId);
        console.log('estimateWalletDeployment ', estimateWalletDeployment);

        estimatedGasUsed += estimateWalletDeployment;
      }

      const tx = await this.createTransaction({ transaction, batchId, chainId });

      const txn: ExecTransaction = {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        operation: tx.operation,
        targetTxGas: tx.targetTxGas
      }

      // to avoid failing eth_call override with undeployed wallet
      txn.targetTxGas = 500000;
  
      const refundInfo: FeeRefundV1_0_6 = {
        baseGas: tx.baseGas,
        gasPrice: tx.gasPrice,
        tokenGasPriceFactor: tx.tokenGasPriceFactor,
        gasToken: tx.gasToken,
        refundReceiver: tx.refundReceiver
      }

      const estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto = {
        chainId,
        transaction: txn,
        walletAddress: this.address,
        feeRefund: refundInfo,
        signature: FAKE_SIGNATURE
      }

      const ethCallOverrideResponse = await this.estimateUndeployedContractGas(estimateUndeployedContractGasDto);
      let noAuthEstimate = Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas);
      console.log('no auth no refund estimate', noAuthEstimate);

      estimatedGasUsed += noAuthEstimate;

      return estimatedGasUsed;
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
    const {
      transaction,
      feeQuote,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = refundTransactionDto
    let walletContract = this.smartAccount(chainId).getContract()
    walletContract = walletContract.attach(this.address)

    let additionalBaseGas = 0;

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    const isDeployed = await this.isDeployed(chainId);
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment(chainId);
      // We know it's going to get deployed by Relayer but we handle refund cost here..
      additionalBaseGas += estimateWalletDeployment; // wallet deployment gas 
    }
    console.log('nonce: ', nonce)

    // in terms of calculating baseGas we should know if wallet is deployed or not otherwise it needs to consider deployment cost
    // (will get batched by relayer)

    const internalTx: MetaTransactionData = {
      to: transaction.to,
      value: transaction.value || 0,
      data: transaction.data || '0x',
      operation: OperationType.Call
    }
    console.log(internalTx)

    let targetTxGas, baseGas, handlePaymentEstimate;
    const regularOffSet = GAS_USAGE_OFFSET

    if(!isDeployed){
      // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
      // targetTxGas?
      // i. use really high value 
      // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !] 

      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {	
        chainId,	
        walletAddress: this.address,	
        transaction: internalTx	
      }	
      const response = await this.estimateRequiredTxGasOverride(estimateRequiredTxGas)
      // TODO
      // Review
      const requiredTxGasEstimate = Number(response.data.gas) + 700000
      console.log('required txgas estimate (with override) ', requiredTxGasEstimate);
      targetTxGas = requiredTxGasEstimate;

      // baseGas?
      // Depending on feeToken provide baseGas! We could use constant value provided by the relayer
      

      const refundDetails: FeeRefundHandlePayment = {	
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice,	
        tokenGasPriceFactor: feeQuote.offset || 1,	
        gasToken: feeQuote.address,	
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }	
      const estimateHandlePaymentGas: EstimateHandlePaymentTxGasDto = {	
        chainId,	
        walletAddress: this.address,	
        feeRefund: refundDetails	
      }	
      const handlePaymentResponse = await this.estimateHandlePaymentGasOverride(estimateHandlePaymentGas)	
      let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      
      console.log('handlePaymentEstimate (with override) ', handlePaymentEstimate);
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas;
    } else {

      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {	
        chainId,	
        walletAddress: this.address,	
        transaction: internalTx	
      }	

      const response = await this.estimateRequiredTxGas(estimateRequiredTxGas);
      // considerable offset ref gnosis safe service client safeTxGas
      const requiredTxGasEstimate = Number(response.data.gas) + 30000
      console.log('required txgas estimate ', requiredTxGasEstimate);
      targetTxGas = requiredTxGasEstimate;

      const refundDetails: FeeRefundHandlePayment = {	
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice,	
        tokenGasPriceFactor: feeQuote.offset || 1,	
        gasToken: feeQuote.address,	
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }	

      const estimateHandlePaymentGas: EstimateHandlePaymentTxGasDto = {	
        chainId,	
        walletAddress: this.address,	
        feeRefund: refundDetails	
      }	
      const handlePaymentResponse = await this.estimateHandlePaymentGas(estimateHandlePaymentGas)	
      let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

      console.log('handlePaymentEstimate ', handlePaymentEstimate);

      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas; // delegate call + event emission + state updates + potential deployment
    }
      
    const walletTx: WalletTransaction = buildSmartAccountTransaction({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data, // for token transfers use encodeTransfer
      targetTxGas: targetTxGas,
      baseGas,
      refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS,
      gasPrice: feeQuote.tokenGasPrice.toString(), //review
      tokenGasPriceFactor: feeQuote.offset || 1,
      gasToken: feeQuote.address,
      nonce
    })

    return walletTx
  }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  async createTransaction(transactionDto: TransactionDto): Promise<WalletTransaction> {
    const {
      transaction,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = transactionDto
    let walletContract = this.smartAccount(chainId).getContract()
    walletContract = walletContract.attach(this.address)

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (await this.isDeployed(chainId)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const walletTx: WalletTransaction = buildSmartAccountTransaction({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data, // for token transfers use encodeTransfer
      nonce
    })

    return walletTx
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
    const {
      transactions,
      feeQuote,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = refundTransactionBatchDto
    let walletContract = this.smartAccount(chainId).getContract()
    const connectedWallet = this.address
    walletContract = walletContract.attach(connectedWallet)

    const isDeployed = await this.isDeployed(chainId);
    let additionalBaseGas = 0;

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      // TODO : estimation cost can be passed

      const estimateWalletDeployment = await this.estimateSmartAccountDeployment(chainId);
      // We know it's going to get deployed by Relayer but we handle refund cost here..
      console.log('estimateWalletDeployment ', estimateWalletDeployment)

      // We know it's going to get deployed by Relayer
      // but we handle refund cost here..
      additionalBaseGas += estimateWalletDeployment // wallet deployment gas
    }
    console.log('nonce: ', nonce)

    const txs: MetaTransaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      const innerTx: WalletTransaction = buildSmartAccountTransaction({
        to: transactions[i].to,
        value: transactions[i].value,
        data: transactions[i].data, // for token transfers use encodeTransfer
        nonce: 0
      })

      txs.push(innerTx)
    }

    const walletTx: WalletTransaction = buildMultiSendSmartAccountTx(
      this.multiSend(chainId).getContract(),
      txs,
      nonce
    );
    console.log('wallet txn with refund ', walletTx);

    const internalTx: MetaTransactionData = {
      to: walletTx.to,
      value: walletTx.value || 0,
      data: walletTx.data || '0x',
      operation: walletTx.operation
    }
    console.log(internalTx);
    
    let targetTxGas, baseGas, handlePaymentEstimate;
    const regularOffSet = GAS_USAGE_OFFSET;

    if(!isDeployed){
      // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
      // targetTxGas?
      // i. use really high value 
      // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !]

      const response = await this.estimateRequiredTxGasOverride({chainId, walletAddress: this.address, transaction: internalTx})	

      // not getting accurate value for undeployed wallet
      // TODO
      // Review
      const requiredTxGasEstimate = Number(response.data.gas) + 700000
      console.log('required txgas estimate (with override) ', requiredTxGasEstimate);
      targetTxGas = requiredTxGasEstimate;

      // baseGas?
      // Depending on feeToken provide baseGas! We could use constant value provided by the relayer

      const refundDetails: FeeRefundHandlePayment = {	
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice, // this would be token gas price // review	
        tokenGasPriceFactor: feeQuote.offset || 1,	
        gasToken: feeQuote.address,	
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }

      const handlePaymentResponse = await this.estimateHandlePaymentGasOverride({chainId, walletAddress: this.address, feeRefund: refundDetails});
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      console.log('handlePaymentEstimate (with override) ', handlePaymentEstimate);
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas;
    } else {

      const response = await this.estimateRequiredTxGas({chainId, walletAddress: this.address, transaction: internalTx})	
      // considerable offset ref gnosis safe service client safeTxGas
      const requiredTxGasEstimate = Number(response.data.gas) + 30000
      console.log('required txgas estimate ', requiredTxGasEstimate);
      targetTxGas = requiredTxGasEstimate;

      const refundDetails: FeeRefundHandlePayment = {	
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice, // this would be token gas price // review	
        tokenGasPriceFactor: feeQuote.offset || 1,	
        gasToken: feeQuote.address,	
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }

      const handlePaymentResponse = await this.estimateHandlePaymentGas({chainId, walletAddress: this.address, feeRefund: refundDetails});
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      console.log('handlePaymentEstimate ', handlePaymentEstimate);
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas; // delegate call + event emission + state updates + potential deployment
    }

    const finalWalletTx: WalletTransaction = buildSmartAccountTransaction({
      to: walletTx.to,
      value: walletTx.value,
      data: walletTx.data, // for token transfers use encodeTransfer
      operation: walletTx.operation,
      targetTxGas: targetTxGas,
      baseGas: baseGas,
      refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS,
      gasPrice: feeQuote.tokenGasPrice.toString(), //review
      tokenGasPriceFactor: feeQuote.offset || 1,
      gasToken: feeQuote.address,
      nonce
    })

    return finalWalletTx
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
    const {
      transactions,
      batchId = 0,
      chainId = this.#smartAccountConfig.activeNetworkId
    } = transactionBatchDto
    let walletContract = this.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract()
    walletContract = walletContract.attach(this.address)

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (await this.isDeployed(chainId)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const txs: MetaTransaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      const innerTx: WalletTransaction = buildSmartAccountTransaction({
        to: transactions[i].to,
        value: transactions[i].value,
        data: transactions[i].data, // for token transfers use encodeTransfer
        nonce: 0
      })

      txs.push(innerTx)
    }

    const walletTx: WalletTransaction = buildMultiSendSmartAccountTx(
      this.multiSend(chainId).getContract(),
      txs,
      nonce
    )
    console.log('wallet txn without refund ', walletTx)

    return walletTx
  }

  async prepareDeployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId) {
    const gasPriceQuotesResponse:FeeOptionsResponse = await this.relayer.getFeeOptions(chainId) 
    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response;
    let feeQuotes: Array<FeeQuote> = [];

    const estimateWalletDeployment = await this.estimateSmartAccountDeployment(chainId);

    feeOptionsAvailable.forEach((feeOption) => {
      // TODO
      // Make it a constant
      const estimatedGasUsed: number = (estimateWalletDeployment + 77369);

      // const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0;
      const offset = feeOption.offset || 1;
      let payment = tokenGasPrice * (estimatedGasUsed) / offset;

      let feeQuote = {
        symbol: feeOption.symbol,
        address: feeOption.address,
        decimal: feeOption.decimal,
        logoUrl: feeOption.logoUrl,
        tokenGasPrice: feeOption.tokenGasPrice,
        offset: feeOption.offset,
        payment: payment,
        refundReceiver: feeOption.refundReceiver
      }

      feeQuotes.push(feeQuote);
    });

    return feeQuotes;
  }

  // Onboarding scenario where assets inside counterfactual smart account pays for it's deployment
  async deployAndPayFees(chainId: ChainId = this.#smartAccountConfig.activeNetworkId, feeQuote: FeeQuote): Promise<string> {
    // Not checking again if the wallet is actually deployed
    // const isDeployed = await this.isDeployed(chainId);
    const token = feeQuote.address;
    const offset = feeQuote.offset || 1;
    const feeReceiver = feeQuote.refundReceiver || DEFAULT_FEE_RECEIVER;

    const estimateWalletDeployment = await this.estimateSmartAccountDeployment(chainId);

    // do estimations here or pass on payment and use feeQuote fully!
    let feesToPay = feeQuote.tokenGasPrice * (estimateWalletDeployment + 77369) / offset;
    feesToPay = parseInt(feesToPay.toString());

    const tx = {
      to: token,
      data: encodeTransfer(feeReceiver, Number(feesToPay))
    };

    const transaction = await this.createTransaction({transaction: tx});
    const txHash = await this.sendTransaction({tx:transaction});
    return txHash;    
  }

  /**
   *
   * @param chainId optional chainId
   * @returns Smart Wallet Contract instance attached with current smart account address (proxy)
   */
  smartAccount(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletContract {
    const smartWallet = this.smartWalletContract[chainId][this.DEFAULT_VERSION]
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
    return this.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION]
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
    return this.multiSendContract[chainId][this.DEFAULT_VERSION]
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
    return this.multiSendCallOnlyContract[chainId][this.DEFAULT_VERSION]
  }

  /**
   * @review
   * returns address of Smart account by actually calling appropriate Wallet Factory contract
   * This method is used in init
   * @param index optional index : Indexes are relevant if the owner/signatory EOA deployed/wants to deploy multiple Smart Accounts
   * @param chainId optional chainId
   * @returns Address of the Smart Account
   */

  async getAddress(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    index: number = 0,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<string> {
    // we will hit smart account endpoint to fetch deployed smart account info
    const address = await this.getAddressForCounterfactualWallet({ index, chainId })
    this.address = address
    return address
    // return await this.getAddressForCounterfactualWallet(index,chainId);
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
    return await this.factory(chainId).isWalletExist(this.address)
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
      baseWallet: this.smartAccount(chainId), //might as well do getContract and attach and return contract
      walletFactory: this.factory(chainId),
      multiSend: this.multiSend(chainId),
      multiSendCall: this.multiSendCall(chainId)
      // Could be added dex router for chain in the future
    }
    return context
  }
}

// Temporary default config
// TODO/NOTE : make Goerli and Mumbai as test networks and remove others
export const DefaultSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.GOERLI, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  backend_url: 'https://sdk-backend.staging.biconomy.io/v1'
}

export default SmartAccount