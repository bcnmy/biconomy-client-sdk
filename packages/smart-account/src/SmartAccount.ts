import { SmartAccountConfig, Transaction } from './types'
import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { ethers } from 'ethers'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract
} from './utils/FetchContractsInfo'
import {
  ChainId,
  SmartAccountContext,
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  RawTransactionType,
  SmartAccountState,
  MetaTransactionData
} from '@biconomy-sdk/core-types'
import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers'
import NodeClient, { ChainConfig, SupportedChainsResponse } from '@biconomy-sdk/node-client'
import { Web3Provider } from '@ethersproject/providers'
import { Relayer } from '@biconomy-sdk/relayer'
import {
  WalletTransaction,
  ExecTransaction,
  FeeRefund,
  SmartAccountTransaction, 
  getSignatureParameters, 
  EIP712_WALLET_TX_TYPE, 
  buildSmartAccountTransaction, 
  smartAccountSignMessage,
  MetaTransaction, 
  buildMultiSendSmartAccountTx
} from '@biconomy-sdk/transactions'
import { BalancesDto } from '@biconomy-sdk/node-client'
import { BalancesResponse, UsdBalanceResponse, EstimateGasResponse } from '@biconomy-sdk/node-client'

// Create an instance of Smart Account with multi-chain support.
class SmartAccount {
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
  smartWalletContract!: { [chainId: number]: SmartWalletContract }
  multiSendContract!: { [chainId: number]: MultiSendContract }
  multiSendCallOnlyContract!: { [chainId: number]: MultiSendCallOnlyContract }
  smartWalletFactoryContract!: { [chainId: number]: SmartWalletFactoryContract }

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
    // upcoming
    // this.relayer
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
    const smartWalletAddress =
      this.chainConfig.find((n) => n.chainId === chainId)?.walletAddress || ''
    const smartWalletFactoryAddress =
      this.chainConfig.find((n) => n.chainId === chainId)?.walletFactoryAddress || ''
    const multiSendAddress =
      this.chainConfig.find((n) => n.chainId === chainId)?.multiSendAddress || ''
    const multiSendCallAddress =
      this.chainConfig.find((n) => n.chainId === chainId)?.multiSendCallAddress || ''

    this.smartWalletFactoryContract[chainId] = getSmartWalletFactoryContract(
      this.ethAdapter[chainId],
      smartWalletFactoryAddress
    )

    // NOTE/TODO : attached address is not wallet address yet
    this.smartWalletContract[chainId] = getSmartWalletContract(
      this.ethAdapter[chainId],
      smartWalletAddress
    )

    this.multiSendContract[chainId] = getMultiSendContract(
      this.ethAdapter[chainId],
      multiSendAddress
    )

    this.multiSendCallOnlyContract[chainId] = getMultiSendCallOnlyContract(
      this.ethAdapter[chainId],
      multiSendCallAddress
    )
  }

  /**
   * Fetch supported chainInfo from backend node : used in init
   * @returns ChainConfig response received from backend node
   */
  private async getSupportedChainsInfo(): Promise<SupportedChainsResponse> {
    return this.nodeClient.getAllSupportedChains()
  }

  public async getAlltokenBalances(balancesDto: BalancesDto, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<BalancesResponse> {
    if(!balancesDto.chainId) balancesDto.chainId = chainId;
    return this.nodeClient.getAlltokenBalances(balancesDto)
  }

  public async getTotalBalanceInUsd(balancesDto: BalancesDto, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<UsdBalanceResponse> {
    if(!balancesDto.chainId) balancesDto.chainId = chainId;  
    return this.nodeClient.getTotalBalanceInUsd(balancesDto)
  }

  /*public async estimateExternalGas(chainId: number, encodedData: string): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateExternalGas(chainId, encodedData)
  }
  public async estimateRequiredTxGas(chainId: number, estimatorAddress: string, transaction: MetaTransactionData): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateRequiredTxGas(chainId, estimatorAddress, transaction)
  }
  public async estimateHandlePaymentGas(chainId: number, estimatorAddress: string, transaction: MetaTransactionData): Promise<EstimateGasResponse> {
    return this.nodeClient.estimateHandlePaymentGas(chainId, estimatorAddress, transaction)
  }*/


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

  // Can also add := sendSignedTransaction

  /**
   *
   * @notice personal sign is used currently (// @todo Signer should be able to use _typedSignData)
   * @param tx WalletTransaction Smart Account Transaction object prepared
   * @param chainId optional chainId
   * @returns:string Signature
   */
  async signTransaction(
    tx: WalletTransaction,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<string> {
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
  async sendTransaction(
    tx: WalletTransaction,
    batchId: number = 0,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<TransactionResponse> {
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

    const refundInfo: FeeRefund = {
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver
    }

    let walletContract = this.smartAccount(chainId).getContract()
    walletContract = walletContract.attach(this.address)

    let signature = await this.signTransaction(tx)

    let execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      batchId,
      refundInfo,
      signature
    )

    rawTx.to = this.address
    rawTx.data = execTransaction.data

    const state = await this.getSmartAccountState(chainId)

    const signedTx = {
      rawTx,
      tx
    }

    const txn = await this.relayer.relay(signedTx, state, this.getSmartAccountContext(chainId))
    return txn
  }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is without fee refund (gasless)
   * @param transaction
   * @param batchId
   * @param chainId
   * @returns
   */
  async createTransaction(
    transaction: Transaction,
    batchId: number = 0,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<WalletTransaction> {
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
   * @todo Write test case and limit batch size based on test results in scw-contracts
   * @notice This transaction is without fee refund (gasless)
   * @param transaction 
   * @param batchId 
   * @param chainId 
   * @returns 
   */
     async createTransactionBatch(transactions: Transaction[], batchId:number = 0,chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<WalletTransaction> {
      let walletContract = this.smartAccount(chainId).getContract();
      walletContract = walletContract.attach(this.address);
      
      // NOTE : If the wallet is not deployed yet then nonce would be zero
      let nonce = 0;
      if(await this.isDeployed(chainId)) {
        nonce = (await walletContract.getNonce(batchId)).toNumber();
      } 
      console.log('nonce: ', nonce);
  
      
      const txs: MetaTransaction[] = [];

      for(let i=0; i < transactions.length; i++) {

        const innerTx: WalletTransaction = buildSmartAccountTransaction({
          to: transactions[i].to,
          value: transactions[i].value,
          data: transactions[i].data, // for token transfers use encodeTransfer
          nonce: 0
        })

        txs.push(innerTx);
      }

      const walletTx: WalletTransaction = buildMultiSendSmartAccountTx(
        this.multiSend(chainId).getContract(),
        txs,
        nonce
      );
  
      return walletTx
    }

  /**
   *
   * @param chainId optional chainId
   * @returns Smart Wallet Contract instance attached with current smart account address (proxy)
   */
  smartAccount(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletContract {
    const smartWallet = this.smartWalletContract[chainId]
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
  factory(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletFactoryContract {
    return this.smartWalletFactoryContract[chainId]
  }

  /**
   *
   * @param chainId optional chainId
   * @returns MultiSend contract instance for requested chainId
   */
  multiSend(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): MultiSendContract {
    return this.multiSendContract[chainId]
  }

  /**
   * @notice the difference between multiSend and multiSendCall
   * Multisend is only used for delegateCalls (i.e. sending off a batch of transaction from Smart account)
   * MultiSendCall is only used for calls (i.e batching Smart Account transaction with another transaction not on Smart Account)
   * @param chainId optional chainId
   * @returns MultiSend Call Only contract instance for requested chainId
   */
  multiSendCall(
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): MultiSendCallOnlyContract {
    return this.multiSendCallOnlyContract[chainId]
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
    index: number = 0,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<string> {
    const address = await this.getAddressForCounterfactualWallet(index, chainId)
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
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<SmartAccountState> {
    const entryPoint = this.chainConfig.find((n) => n.chainId === chainId)?.entryPoint
    const fallbackHandlerAddress = this.chainConfig.find(
      (n) => n.chainId === chainId
    )?.fallBackHandler
    const state: SmartAccountState = {
      address: this.address,
      owner: this.owner,
      isDeployed: await this.isDeployed(chainId), // could be set as state in init
      entryPointAddress: entryPoint || '',
      fallbackHandlerAddress: fallbackHandlerAddress || ''
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

  // Review :  more / other potential methods
  // sendSignedTransaction
  // signMessage

  // Discuss about multichain aspect of relayer node url and clients
  // TODO: get details from backend config
  // NOTE: Discuss about multichain aspect of relayer node url and clients

  // more methods to fetch balance via backend -> indexer node
  // getTokenBalances() @Talha

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
   */
  private async getAddressForCounterfactualWallet(
    index: number = 0,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<string> {
    return await this.smartWalletFactoryContract[chainId].getAddressForCounterfactualWallet(
      this.owner,
      index
    )
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