import { CHAIN_CONFIG } from './constants'
import EthersAdapter from 'ethers-lib'
import { SmartAccountConfig } from './types'
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

type ObjectKey = keyof typeof CHAIN_CONFIG

export class SmartAccount {
  // { ethAdapter } is a window that gave access to all the Implemented function of it
  private ethAdapter: EthersAdapter

  // hold instantiated chain info
  private chainInfo: any

  // contract instances
  private smartWallet!: SmartWalletContract
  private multiSendContract!: MultiSendContract
  private smartWalletFacoryContract!: SmartWalletFactoryContract

  constructor(config: SmartAccountConfig) {
    const chainName = config.chain_name as ObjectKey

    // retrive chain info from {ChainConfigs} to have default values for properties
    this.chainInfo = CHAIN_CONFIG[chainName]

    // assign default chain constants {this.chainInfo} incase optional are not supplied
    config = Object.assign(config, this.chainInfo)

    // setting up provider
    const provider = new ethers.providers.JsonRpcProvider(config.providerUrl)
    const signer = provider.getSigner(config.owner)

    // instantiating EthersAdapter instance and maintain it as class level variable
    this.ethAdapter = new EthersAdapter({
      ethers,
      signer
    })
    // contracts initialization
    this.initializeContracts(this.chainInfo.chainId)
  }

  // intialize contract to be used throughout this class
  private async initializeContracts(chainId: number): Promise<void> {
    this.smartWallet = await getSmartWalletContract(chainId, this.ethAdapter)
    this.multiSendContract = await getMultiSendContract(chainId, this.ethAdapter)
    this.smartWalletFacoryContract = await getSmartWalletFactoryContract(chainId, this.ethAdapter)
  }

  // return adapter instance to used for blockchain interactions
  getEthAdapter(): EthersAdapter {
    return this.ethAdapter
  }

  // return configuration used for intialization of the { wallet }instance
  getSmartAccountConfig(): SmartAccountConfig {
    return this.chainInfo
  }

  // return smartaccount singelton address
  getSmartWalletContractAddress(): string {
    return this.smartWallet.getAddress()
  }

  // return multisend singelton address
  getMultiSendContractAddress(): string {
    return this.multiSendContract.getAddress()
  }

  // return proxy wallet singelton address
  getSmartWalletFacoryContractAddress(): string {
    return this.smartWalletFacoryContract.getAddress()
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
   */
  getAddressForCounterfactualWallet(address: string, index: number = 0): Promise<string> {
    return this.smartWalletFacoryContract.getAddressForCounterfactualWallet(address, index)
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description deploy Smart Account for EOA against specific index
   * @returns
   */
  async deployCounterFactualWallet(address: string, index: number = 0): Promise<TransactionResult> {
    const walletAddress = await this.getAddressForCounterfactualWallet(address, index)
    const isContractDeployed = await this.ethAdapter.isContractDeployed(walletAddress)
    if (!isContractDeployed) {
      throw new Error('Smart Wallet is not deployed on the current network')
    }
    // TODO: relayer stuff
    return this.smartWalletFacoryContract.deployCounterFactualWallet(
      address,
      this.chainInfo.entryPoint,
      this.chainInfo.handler,
      index
    )
  }
}
