import {
  ChainId,
  SmartWalletContract,
  SmartWalletFactoryContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  SmartAccountContext,
  SmartAccountConfig
} from '@biconomy-sdk/core-types'
import { ChainConfig, SupportedChainsResponse } from '@biconomy-sdk/node-client'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract
} from './utils/FetchContractsInfo'
import { ethers, Signer } from 'ethers'
import EvmNetworkManager from '@biconomy-sdk/ethers-lib'
import { SmartAccountVersion } from '@biconomy-sdk/core-types'

class ContractUtils {
  ethAdapter!: { [chainId: number]: EvmNetworkManager }

  smartWalletContract!: { [chainId: number]: { [version: string]: SmartWalletContract } }
  multiSendContract!: { [chainId: number]: { [version: string]: MultiSendContract } }
  multiSendCallOnlyContract!: {
    [chainId: number]: { [version: string]: MultiSendCallOnlyContract }
  }
  smartWalletFactoryContract!: {
    [chainId: number]: { [version: string]: SmartWalletFactoryContract }
  }

  // Note: Should DEFAULT_VERSION be moved here?

  constructor(readonly version: string) {
    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.multiSendCallOnlyContract = {}
    this.smartWalletFactoryContract = {}
  }

  public getSmartWalletContract(chainId: number): SmartWalletContract {
    return this.smartWalletContract[chainId][this.version]
  }

  public async initialize(
    supportedChains: ChainConfig[],
    config: SmartAccountConfig,
    signer: Signer
  ) {
    const chainsInfo = supportedChains

    for (let i = 0; i < chainsInfo.length; i++) {
      const network = chainsInfo[i]
      // To keep it network agnostic
      // Note: think about events when signer needs to pay gas

      let providerUrl =
        config.providerUrlConfig?.find((element) => element.chainId === network.chainId)
          ?.providerUrl || ''
      console.log('Used provider from config ', providerUrl)

      if (!providerUrl) providerUrl = network.providerUrl

      const readProvider = new ethers.providers.JsonRpcProvider(providerUrl)

      console.log('chain id ', network.chainId, 'readProvider ', readProvider)

      // Instantiating EthersAdapter instance and maintain it as above mentioned class level variable
      this.ethAdapter[network.chainId] = new EvmNetworkManager({
        ethers,
        signer,
        provider: readProvider
      })

      this.smartWalletFactoryContract[network.chainId] = {}
      this.smartWalletContract[network.chainId] = {}
      this.multiSendContract[network.chainId] = {}
      this.multiSendCallOnlyContract[network.chainId] = {}
      this.initializeContracts(network)
    }
  }
  initializeContracts(chaininfo: ChainConfig) {
    // We get the addresses using chainConfig fetched from backend node

    const smartWallet = chaininfo.wallet
    const smartWalletFactoryAddress = chaininfo.walletFactory
    const multiSend = chaininfo.multiSend
    const multiSendCall = chaininfo.multiSendCall
    for (let index = 0; index < smartWallet.length; index++) {
      const version = smartWallet[index].version
      console.log(smartWallet[index])

      this.smartWalletFactoryContract[chaininfo.chainId][version] = getSmartWalletFactoryContract(
        version,
        this.ethAdapter[chaininfo.chainId],
        smartWalletFactoryAddress[index].address
      )
      // NOTE/TODO : attached address is not wallet address yet
      this.smartWalletContract[chaininfo.chainId][version] = getSmartWalletContract(
        version,
        this.ethAdapter[chaininfo.chainId],
        smartWallet[index].address
      )

      this.multiSendContract[chaininfo.chainId][version] = getMultiSendContract(
        version,
        this.ethAdapter[chaininfo.chainId],
        multiSend[index].address
      )

      this.multiSendCallOnlyContract[chaininfo.chainId][version] = getMultiSendCallOnlyContract(
        version,
        this.ethAdapter[chaininfo.chainId],
        multiSendCall[index].address
      )
    }
  }

  // TODO: params as Object
  // May not need it at all if we go provider route
  async isDeployed(chainId: ChainId, version: string, address: string): Promise<boolean> {
    // Other approach : needs review and might be coming wrong
    // const readProvider = new ethers.providers.JsonRpcProvider(networks[chainId].providerUrl);
    // const walletCode = await readProvider.getCode(await this.getAddress(chainId));
    // return !!walletCode && walletCode !== '0x'

    // but below works
    return await this.smartWalletFactoryContract[chainId][version].isWalletExist(address)
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
    chainId: ChainId,
    version: SmartAccountVersion
  ): SmartAccountContext {
    const context: SmartAccountContext = {
      baseWallet: this.smartWalletContract[chainId][version],
      walletFactory: this.smartWalletFactoryContract[chainId][version],
      multiSend: this.multiSendContract[chainId][version],
      multiSendCall: this.multiSendCallOnlyContract[chainId][version]
      // Could be added dex router for chain in the future
    }
    return context
  }
}

export default ContractUtils
