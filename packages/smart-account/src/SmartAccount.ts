import { SmartAccountConfig, networks, NetworkConfig, ChainId, ChainConfig } from './types'
import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { ethers } from 'ethers'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getSmartWalletContract
} from './utils/FetchContractsInfo'
import {
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  TransactionResult
} from '@biconomy-sdk/core-types'
import SafeServiceClient from '@biconomy-sdk/node-client';

class SmartAccount {
  // { ethAdapter } is a window that gave access to all the Implemented function of it
  ethAdapter!: { [chainId: number]: EthersAdapter }

  // hold instantiated chain info
  #smartAccountConfig!: SmartAccountConfig

  // hold supported network info
  supportedNetworkIds!: ChainId[]

  nodeClient!: SafeServiceClient 

  // contract instances
  smartWalletContract!: { [chainId: number]: SmartWalletContract }
  multiSendContract!: { [chainId: number]: MultiSendContract }
  smartWalletFactoryContract!: { [chainId: number]: SmartWalletFactoryContract }


  // Review :: ToDo
  // To be able to passs provider : WalletProviderLike 
  constructor(config: SmartAccountConfig) {

    this.#smartAccountConfig = config
    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.smartWalletFactoryContract = {}
    this.supportedNetworkIds = config.supportedNetworksIds
    
    this.nodeClient = new SafeServiceClient({txServiceUrl: config.backend_url});
  }

  // for testing
  // providers and contracts initialization
  public async init(): Promise<SmartAccount> {
    const chainConfig = await this.getSupportedChainsInfo();
    console.log("chain config: ", chainConfig);

    this.supportedNetworkIds.forEach(async (network) => {
      const provider = new ethers.providers.JsonRpcProvider(
        networks[network].providerUrl
      )
      const signer = provider.getSigner(this.#smartAccountConfig.owner)

      // instantiating EthersAdapter instance and maintain it as class level variable
      this.ethAdapter[network] = new EthersAdapter({
        ethers,
        signer
      })

      this.initializeContracts(network);
    })    
    return this;
  }

  // getSupportedNetworks / chains endpoint


  // intialize contract to be used throughout this class
  private initializeContracts(chainId: ChainId) {
    this.smartWalletFactoryContract[networks[chainId].chainId] = getSmartWalletFactoryContract(
      chainId,
      this.ethAdapter[chainId]
    );

    this.smartWalletContract[networks[chainId].chainId] = getSmartWalletContract(
      chainId,
      this.ethAdapter[chainId]
    );

    this.multiSendContract[networks[chainId].chainId] = getMultiSendContract(
      chainId,
      this.ethAdapter[chainId]
    );
  }

  private async getSupportedChainsInfo(): Promise<ChainConfig[]> {
    return this.nodeClient.getChainInfo();
  }

  // return adapter instance to used for blockchain interactions
  ethersAdapter(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): EthersAdapter {
    return this.ethAdapter[chainId]
  }

  // return configuration used for intialization of the { wallet }instance
  getSmartAccountConfig(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): NetworkConfig {
    return networks[chainId]
  }

  // return smartaccount instance
  smartAccount(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletContract {
    return this.smartWalletContract[networks[chainId].chainId]
  }

  // return multisend contract instance
  multiSend(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): MultiSendContract {
    return this.multiSendContract[networks[chainId].chainId]
  }

  factory(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletFactoryContract {
    return this.smartWalletFactoryContract[networks[chainId].chainId]
  }

  // Review
  async getAddress(index: number = 0, chainId: ChainId = this.#smartAccountConfig.activeNetworkId) : Promise<string> {
    return await this.getAddressForCounterfactualWallet(index,chainId);
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
   */
  async getAddressForCounterfactualWallet(index: number = 0, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<string> {
    return await this.smartWalletFactoryContract[
      networks[chainId].chainId
    ].getAddressForCounterfactualWallet(this.#smartAccountConfig.owner, index)
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description deploy Smart Account for EOA against specific index
   * @returns
   */
  // Marked for deletion
  // Call the relayer for deployment!
  async deployCounterFactualWallet(
    index: number = 0,
    chainId: ChainId = this.#smartAccountConfig.activeNetworkId
  ): Promise<TransactionResult> {
    const networkInfo = networks[chainId]
    const walletAddress = await this.getAddressForCounterfactualWallet(index, chainId)
    const isContractDeployed = await this.ethAdapter[chainId].isContractDeployed(walletAddress)
    if (!isContractDeployed) {
      throw new Error('Smart Wallet is not deployed on the current network')
    }
    // TODO: relayer stuff
    return this.smartWalletFactoryContract[chainId].deployCounterFactualWallet(
      this.#smartAccountConfig.owner,
      networkInfo.entryPoint,
      networkInfo.fallbackHandler,
      index
    )
  }
}
export default SmartAccount
