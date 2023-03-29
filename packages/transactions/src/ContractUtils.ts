import {
  ChainId,
  SmartWalletContract,
  SmartWalletFactoryContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  SmartAccountContext,
  SmartAccountState,
  FallbackGasTankContract
} from '@biconomy/core-types'
import { ChainConfig } from '@biconomy/node-client'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract,
  getFallbackGasTankContract
} from './utils/FetchContractsInfo'
import { ethers, Signer } from 'ethers'
import EvmNetworkManager from '@biconomy/ethers-lib'
import { SmartAccountVersion } from '@biconomy/core-types'
import { ISmartAccount } from '@biconomy/node-client'
import { Logger } from '@biconomy/common'

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

  fallbackGasTankContract!: { [chainId: number]: { [version: string]: FallbackGasTankContract } }
  //defaultCallbackHandlerContract!: { [chainId: number]: { [version: string]: DefaultCallbackHandlerContract } }

  smartAccountState!: SmartAccountState

  constructor(readonly chainConfig: ChainConfig[]) {
    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.multiSendCallOnlyContract = {}
    this.smartWalletFactoryContract = {}
    this.fallbackGasTankContract = {}
    //this.defaultCallbackHandlerContract = {}
  }

  initializeContracts(
    signer: Signer,
    readProvider: ethers.providers.JsonRpcProvider,
    walletInfo: ISmartAccount,
    chaininfo: ChainConfig
  ) {
    this.ethAdapter[walletInfo.chainId] = new EvmNetworkManager({
      ethers,
      signer,
      provider: readProvider
    })
    this.smartWalletFactoryContract[walletInfo.chainId] = {}
    this.smartWalletContract[walletInfo.chainId] = {}
    this.multiSendContract[walletInfo.chainId] = {}
    this.multiSendCallOnlyContract[walletInfo.chainId] = {}
    this.fallbackGasTankContract[walletInfo.chainId] = {}
    //this.defaultCallbackHandlerContract[walletInfo.chainId] = {}
    const version = walletInfo.version
    Logger.log('version ', version)

    this.smartWalletFactoryContract[walletInfo.chainId][version] = getSmartWalletFactoryContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      walletInfo.factoryAddress
    )
    Logger.log('Factory Address ', walletInfo.factoryAddress)

    this.smartWalletContract[walletInfo.chainId][version] = getSmartWalletContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      walletInfo.smartAccountAddress
    )
    Logger.log('SmartAccount Address ', walletInfo.smartAccountAddress)

    this.multiSendContract[walletInfo.chainId][version] = getMultiSendContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      chaininfo.multiSend[chaininfo.multiSend.length - 1].address
    )

    this.multiSendCallOnlyContract[walletInfo.chainId][version] = getMultiSendCallOnlyContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      chaininfo.multiSendCall[chaininfo.multiSendCall.length - 1].address
    )

    this.fallbackGasTankContract[walletInfo.chainId][Number(version)] = getFallbackGasTankContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      chaininfo.fallBackGasTankAddress
    )

    /*this.defaultCallbackHandlerContract[walletInfo.chainId][version] = getDefaultCallbackHandlerContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      walletInfo.fallBackHandlerAddress
    )*/
  }

  async isDeployed(chainId: ChainId, address: string): Promise<boolean> {
    return await this.ethAdapter[chainId].isContractDeployed(address)
  }

  //
  /**
   * Serves smart contract instances associated with Smart Account for requested ChainId
   * Context is useful when relayer is deploying a wallet
   * @param chainId requested chain : default is active chain
   * @returns object containing relevant contract instances
   */
  getSmartAccountContext(chainId: ChainId, version: SmartAccountVersion): SmartAccountContext {
    const context: SmartAccountContext = {
      baseWallet: this.smartWalletContract[chainId][version],
      walletFactory: this.smartWalletFactoryContract[chainId][version],
      multiSend: this.multiSendContract[chainId][version],
      multiSendCall: this.multiSendCallOnlyContract[chainId][version]
      // Could be added dex router for chain in the future
    }
    return context
  }

  setSmartAccountState(smartAccountState: SmartAccountState): void {
    this.smartAccountState = smartAccountState
  }

  getSmartAccountState(): SmartAccountState {
    return this.smartAccountState
  }

  attachWalletContract(chainId: ChainId, version: SmartAccountVersion, address: string) {
    const walletContract = this.smartWalletContract[chainId][version].getContract()
    return walletContract.attach(address)
  }
}

export default ContractUtils
