import { SmartAccountConfig, networks, ChainId, ChainConfig, 
  SmartAccountContext, Transaction, ZERO_ADDRESS, ChainConfigResponse } from './types'
  import { TypedDataDomain, TypedDataField, TypedDataSigner } from '@ethersproject/abstract-signer'
import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { ethers, providers, Wallet } from 'ethers'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getSmartWalletContract
} from './utils/FetchContractsInfo'
import {
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  TransactionResult,
  RawTransactionType,
  SmartAccountState,
} from '@biconomy-sdk/core-types'
import { JsonRpcSigner, TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import SafeServiceClient from '@biconomy-sdk/node-client';
import { Web3Provider } from '@ethersproject/providers'
import { Relayer, LocalRelayer } from '@biconomy-sdk/relayer';
import { 
  WalletTransaction, 
  ExecTransaction, 
  FeeRefund, 
  SmartAccountTransaction, 
  getSignatureParameters, 
  EIP712_WALLET_TX_TYPE, 
  buildWalletTransaction, 
  safeSignMessage 
} from '@biconomy-sdk/transactions';

class SmartAccount {
  // { ethAdapter } is a window that gave access to all the Implemented function of it
  ethAdapter!: { [chainId: number]: EthersAdapter }

  context!: { [chainId: number]: SmartAccountContext }

  // hold instantiated chain info
  #smartAccountConfig!: SmartAccountConfig

  // hold supported network info
  supportedNetworkIds!: ChainId[]

  chainConfig!: ChainConfig[]

  // providers!:  Web3Provider[]
  provider!:  Web3Provider

  signer!: JsonRpcSigner 

  nodeClient!: SafeServiceClient 

  relayer!: Relayer

  owner!: string

  address!: string

  // Can make isDeployed a state variable

  // contract instances
  smartWalletContract!: { [chainId: number]: SmartWalletContract }
  multiSendContract!: { [chainId: number]: MultiSendContract }
  smartWalletFactoryContract!: { [chainId: number]: SmartWalletFactoryContract }


  // Review :: ToDo
  // To be able to passs provider : WalletProviderLike 
  // in mexa sdk we have ExternalProvider
  constructor(walletProvider:Web3Provider ,config?: Partial<SmartAccountConfig>) {

    this.#smartAccountConfig = { ...DefaultSmartAccountConfig }
    if (config) {
      this.#smartAccountConfig = { ...this.#smartAccountConfig, ...config }
    }

    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.smartWalletFactoryContract = {}
    this.supportedNetworkIds = this.#smartAccountConfig.supportedNetworksIds;
    this.provider = walletProvider
    this.signer = walletProvider.getSigner();
    
    this.nodeClient = new SafeServiceClient({txServiceUrl: this.#smartAccountConfig.backend_url});
  }

  // for testing
  // providers and contracts initialization
  public async init(): Promise<SmartAccount> {
    const chainConfig = (await this.getSupportedChainsInfo()).data;
    this.chainConfig = chainConfig;
    console.log("chain config: ", chainConfig);
    // instead of getting from networks, get details from chainConfig

    const signer = this.signer;
    // Review
    // check usage of getsignerByAddress from mexa/sdk and playground

    for(let i=0; i < this.supportedNetworkIds.length; i++) {
      const network = this.supportedNetworkIds[i];
      const providerUrl = chainConfig.find(n => n.chainId === network)?.providerUrl;
      const readProvider = new ethers.providers.JsonRpcProvider(providerUrl);
      // instantiating EthersAdapter instance and maintain it as class level variable
      this.ethAdapter[network] = new EthersAdapter({
        ethers,
        signer,
        provider:readProvider
      })

      // EntryPoint and FallbackHandler etc Has to be same for all networks
    
      this.initializeContracts(network);
    }   
    // Review
    this.owner = await this.ethersAdapter().getSignerAddress();
    // Commeting below only for debugging test case!!
    this.address = await this.getAddress();
    return this;
  }

  // getSupportedNetworks / chains endpoint


  // intialize contract to be used throughout this class
  private initializeContracts(chainId: ChainId) {
    this.smartWalletFactoryContract[chainId] = getSmartWalletFactoryContract(
      chainId,
      this.ethAdapter[chainId]
    );

    // Should attach the address here
    this.smartWalletContract[chainId] = getSmartWalletContract(
      chainId,
      this.ethAdapter[chainId]
    );

    this.multiSendContract[chainId] = getMultiSendContract(
      chainId,
      this.ethAdapter[chainId]
    );
  }

  private async getSupportedChainsInfo(): Promise<ChainConfigResponse> {
    return this.nodeClient.getChainInfo();
  }

  // return adapter instance to be used for blockchain interactions
  ethersAdapter(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): EthersAdapter {
    return this.ethAdapter[chainId]
  }

  // return configuration used for intialization of the { wallet } instance
  // Review wording and need
  /*getSmartAccountConfig(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): ChainConfig {
    // networks should come from chainConfig instead
    return this.chainConfig[chainId]
  }*/

  // Assigns transaction relayer to this smart wallet instance
  setRelayer(relayer: Relayer): SmartAccount {
    if (relayer === undefined) return this
    this.relayer = relayer
    return this
  }

  setActiveChain(chainId: ChainId): SmartAccount {
    this.#smartAccountConfig.activeNetworkId = chainId;
    return this;
  }

  // async sendSignedTransaction : must expect signature!
  // async sign 
  async signTransaction(tx: WalletTransaction, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<string> {

    let walletContract = this.smartAccount(chainId).getContract();
    walletContract = walletContract.attach(this.address);

    const { signer, data } = await safeSignMessage(
      this.signer,
      walletContract,
      tx,
      chainId
    );

    let signature = "0x";
    signature += data.slice(2);
    return signature;
  }


  // will get signer's signature
  // TODO:
  // Signer should be able to use _typedSignData
  async sendTransaction(tx:WalletTransaction, batchId:number = 0, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<TransactionResponse> {
    let rawTx: RawTransactionType = {
      to: tx.to,
      data: tx.data,
      value: tx.value,
      chainId: chainId
    };

    const transaction: ExecTransaction = {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      operation: tx.operation,
      targetTxGas: tx.targetTxGas,
    };

    const refundInfo: FeeRefund = {
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver,
    };

    // Should call this.signTransaction
    let walletContract = this.smartAccount(chainId).getContract();
    walletContract = walletContract.attach(this.address);

    let signature = await this.signTransaction(tx);
 
    let execTransaction = await walletContract.populateTransaction.execTransaction(
      transaction,
      batchId,
      refundInfo,
      signature
    );

    rawTx.to = this.address;
    rawTx.data = execTransaction.data;

    const state = await this.getSmartAccountState(chainId);

    const signedTx = {
      rawTx,
      tx
    }

    const txn = await this.relayer.relay(signedTx, state, this.getSmartAccountContext(chainId));
    return txn;
  }

  // Todo : rename 
  // This transaction is without fee refund (gasless)
  // We need to have identifiers for these txns
  async createSmartAccountTransaction(transaction: Transaction, batchId:number = 0,chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<WalletTransaction> {
    let walletContract = this.smartAccount(chainId).getContract();
    walletContract = walletContract.attach(this.address);
    
    // If the wallet is not deployed yet then nonce would be zero
    // Review
    let nonce = 0;
    if(await this.isDeployed(chainId)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber();
    } 
    console.log('nonce: ', nonce);

    const walletTx: WalletTransaction = buildWalletTransaction({
      to: transaction.to,
      // value: ethers.utils.parseEther("1"),
      data: transaction.data, // for token transfers use encodeTransfer
      nonce
    });

    return walletTx;
  };

  // return smartaccount instance
  // maybe call this basewallet or wallet
  smartAccount(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletContract {
    const smartWallet = this.smartWalletContract[chainId]
    const address = this.address;
    smartWallet.getContract().attach(address);
    return smartWallet;
  }

  factory(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletFactoryContract {
    return this.smartWalletFactoryContract[chainId]
  }

  multiSend(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): MultiSendContract {
    return this.multiSendContract[chainId]
  }

  // Optional index allowed
  async getAddress(index: number = 0, chainId: ChainId = this.#smartAccountConfig.activeNetworkId) : Promise<string> {
    return await this.getAddressForCounterfactualWallet(index,chainId);
  }

  // Review
  async isDeployed(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<boolean> {
    // might be coming wrong..
    // const readProvider = new ethers.providers.JsonRpcProvider(networks[chainId].providerUrl);
    // const walletCode = await readProvider.getCode(await this.getAddress(chainId));
    // return !!walletCode && walletCode !== '0x'

    // but below works
    return await this.factory(chainId).isWalletExist(this.address);
  }

  // sort of config
  async getSmartAccountState(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<SmartAccountState> {
    const entryPoint = this.chainConfig.find(n => n.chainId === chainId)?.entryPoint;
    const fallbackHandlerAddress = this.chainConfig.find(n => n.chainId === chainId)?.fallBackHandler;
    const state: SmartAccountState = {
       address: this.address,
       owner: this.owner,
       isDeployed: await this.isDeployed(chainId), // could be set as state in init
       entryPointAddress: entryPoint || '',
       fallbackHandlerAddress: fallbackHandlerAddress || ''
    }
    return state;
  }

  // Instead of addresses should return contract instances
  getSmartAccountContext(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartAccountContext {
    const context: SmartAccountContext = {
      baseWallet: this.smartAccount(chainId), //might as well do getContract and attach and return contract
      walletFactory: this.factory(chainId),
      multiSend: this.multiSend(chainId)
    }
   return context;
  }

  // more methods
  // accountConfiguration?
  // sendSignedTransaction
  // signMessage
  
  // Discuss about multichain aspect of relayer node url and clients
  // TODO: get details from backend config

  // more methods to fetch balance via backend -> indexer node
  // getTokenBalances()

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
   */
  async getAddressForCounterfactualWallet(index: number = 0, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<string> {
    return await this.smartWalletFactoryContract[
      chainId
    ].getAddressForCounterfactualWallet(this.owner, index)
  }
}

export const DefaultSmartAccountConfig: SmartAccountConfig = {
  activeNetworkId: ChainId.RINKEBY, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.RINKEBY, ChainId.MUMBAI],
  backend_url: "http://localhost:3000/v1"
}

export default SmartAccount
