import { SmartAccountConfig, networks, NetworkConfig, ChainId } from './types'
import EthersAdapter from 'ethers-lib'
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
} from 'core-types'

class SmartAccount {
  // { ethAdapter } is a window that gave access to all the Implemented function of it
  ethAdapter!: { [chainId: number]: EthersAdapter }

  // hold instantiated chain info
  #smartAccountConfig!: SmartAccountConfig

  // hold supported network info
  supportedNetworkIds!: ChainId[]

  // contract instances
  smartWalletContract!: { [chainId: number]: SmartWalletContract }
  multiSendContract!: { [chainId: number]: MultiSendContract }
  smartWalletFacoryContract!: { [chainId: number]: SmartWalletFactoryContract }

  constructor(config: SmartAccountConfig) {

    this.#smartAccountConfig = config
    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.smartWalletFacoryContract = {}
    this.supportedNetworkIds = config.supportedNetworksIds

    // providers and contracts initialization
    for (let index = 0; index < this.supportedNetworkIds.length; index++) {
      const provider = new ethers.providers.JsonRpcProvider(
        networks[this.supportedNetworkIds[index]].providerUrl
      )
      const signer = provider.getSigner(config.owner)

      // instantiating EthersAdapter instance and maintain it as class level variable
      this.ethAdapter[this.supportedNetworkIds[index]] = new EthersAdapter({
        ethers,
        signer
      })
      // contracts initialization
      // comments as contracts are not yet deployed
      this.initializeContracts(this.supportedNetworkIds[index]).then()
    }
  }

  // intialize contract to be used throughout this class
  private async initializeContracts(chainId: ChainId): Promise<void> {
    this.smartWalletContract[networks[chainId].chainId] = await getSmartWalletContract(
      chainId,
      this.ethAdapter[chainId]
    )
    this.multiSendContract[networks[chainId].chainId] = await getMultiSendContract(
      chainId,
      this.ethAdapter[chainId]
    )
    this.smartWalletFacoryContract[networks[chainId].chainId] = await getSmartWalletFactoryContract(
      chainId,
      this.ethAdapter[chainId]
    )
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

  // return proxy wallet instance
  factory(chainId: ChainId = this.#smartAccountConfig.activeNetworkId): SmartWalletFactoryContract {
    return this.smartWalletFacoryContract[networks[chainId].chainId]
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
   */
  getAddressForCounterfactualWallet(index: number = 0, chainId: ChainId = this.#smartAccountConfig.activeNetworkId): Promise<string> {
    return this.smartWalletFacoryContract[
      networks[chainId].chainId
    ].getAddressForCounterfactualWallet(this.#smartAccountConfig.owner, index)
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description deploy Smart Account for EOA against specific index
   * @returns
   */
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
    return this.smartWalletFacoryContract[chainId].deployCounterFactualWallet(
      this.#smartAccountConfig.owner,
      networkInfo.entryPoint,
      networkInfo.fallbackHandler,
      index
    )
  }
}
export default SmartAccount
