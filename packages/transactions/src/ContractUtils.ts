import {
  ChainId,
  SmartWalletContract,
  SmartWalletFactoryContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  SmartAccountContext,
  SmartAccountState,
  FallbackGasTankContract,
  DefaultCallbackHandlerContract
} from '@biconomy/core-types'
import { ChainConfig } from '@biconomy/node-client'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract,
  getFallbackGasTankContract,
  getDefaultCallbackHandlerContract
} from './utils/FetchContractsInfo'
import { ethers, Signer } from 'ethers'
import EvmNetworkManager from '@biconomy/ethers-lib'
import { SmartAccountVersion } from '@biconomy/core-types'
import { ISmartAccount } from '@biconomy/node-client'

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

  // defaultCallbackHandlerContract!: { [chainId: number]: { [version: string]: DefaultCallbackHandlerContract } }

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

  initializeContracts( signer: Signer,
    readProvider: ethers.providers.JsonRpcProvider,
    walletInfo: ISmartAccount,
    chaininfo: ChainConfig){
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
    console.log('version ', version);
    
    this.smartWalletFactoryContract[walletInfo.chainId][version] = getSmartWalletFactoryContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      walletInfo.factoryAddress
    )
    console.log('factoryAddress ',  walletInfo.factoryAddress);

    this.smartWalletContract[walletInfo.chainId][version] = getSmartWalletContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      walletInfo.smartAccountAddress
    )
    console.log('smartAccountAddress ',  walletInfo.smartAccountAddress);


    this.multiSendContract[walletInfo.chainId][version] = getMultiSendContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      chaininfo.multiSend[chaininfo.multiSend.length - 1].address
    )
    // console.log('multiSend ',  chaininfo.multiSend[Number(version)].address);


    this.multiSendCallOnlyContract[walletInfo.chainId][version] = getMultiSendCallOnlyContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      chaininfo.multiSendCall[chaininfo.multiSendCall.length - 1].address
    )
    // console.log('multiSendCall ',  chaininfo.multiSendCall[chaininfo.multiSendCall.length].address);


    this.fallbackGasTankContract[walletInfo.chainId][Number(version)] = getFallbackGasTankContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      chaininfo.fallBackGasTankAddress
    )
    console.log('fallBackGasTankAddress ',  chaininfo.fallBackGasTankAddress);

    /*this.defaultCallbackHandlerContract[walletInfo.chainId][version] = getDefaultCallbackHandlerContract(
      version,
      this.ethAdapter[walletInfo.chainId],
      walletInfo.fallBackHandlerAddress
    )
    console.log('defaultCallbackHandlerAddress ',  walletInfo.fallBackHandlerAddress);*/
    // 

    }

  // initializeContracts(
  //   signer: Signer,
  //   readProvider: ethers.providers.JsonRpcProvider,
  //   chaininfo: ChainConfig
  // ) {
  //   // We get the addresses using chainConfig fetched from backend node

  //   const smartWallet = chaininfo.wallet
  //   const smartWalletFactoryAddress = chaininfo.walletFactory
  //   const fallbackGasTankAddress = chaininfo.fallBackGasTankAddress
  //   const multiSend = chaininfo.multiSend
  //   const multiSendCall = chaininfo.multiSendCall
  //   this.ethAdapter[chaininfo.chainId] = new EvmNetworkManager({
  //     ethers,
  //     signer,
  //     provider: readProvider
  //   })

  //   this.smartWalletFactoryContract[chaininfo.chainId] = {}
  //   this.smartWalletContract[chaininfo.chainId] = {}
  //   this.multiSendContract[chaininfo.chainId] = {}
  //   this.multiSendCallOnlyContract[chaininfo.chainId] = {}
  //   this.fallbackGasTankContract[chaininfo.chainId] = {}

  //   for (let index = 0; index < smartWallet.length; index++) {
  //     const version = smartWallet[index].version

  //     this.smartWalletFactoryContract[chaininfo.chainId][version] = getSmartWalletFactoryContract(
  //       version,
  //       this.ethAdapter[chaininfo.chainId],
  //       smartWalletFactoryAddress[index].address
  //     )
  //     // NOTE/TODO : attached address is not wallet address yet
  //     this.smartWalletContract[chaininfo.chainId][version] = getSmartWalletContract(
  //       version,
  //       this.ethAdapter[chaininfo.chainId],
  //       smartWallet[index].address
  //     )

  //     this.multiSendContract[chaininfo.chainId][version] = getMultiSendContract(
  //       version,
  //       this.ethAdapter[chaininfo.chainId],
  //       multiSend[index].address
  //     )

  //     this.multiSendCallOnlyContract[chaininfo.chainId][version] = getMultiSendCallOnlyContract(
  //       version,
  //       this.ethAdapter[chaininfo.chainId],
  //       multiSendCall[index].address
  //     )

  //     this.fallbackGasTankContract[chaininfo.chainId][version] = getFallbackGasTankContract(
  //       version,
  //       this.ethAdapter[chaininfo.chainId],
  //       fallbackGasTankAddress
  //     )
  //   }
  // }

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

  setSmartAccountState(smartAccountState: SmartAccountState): void{
    this.smartAccountState = smartAccountState
  }

  getSmartAccountState(
  ): SmartAccountState {
    // smartAccountState: SmartAccountState,
    // currentVersion?: string,
    // currentChainId?: ChainId
    // console.log(smartAccountState, currentVersion, currentChainId);
    return this.smartAccountState
    // const { address, owner, chainId, version } = smartAccountState

    // if (!currentVersion) {
    //   currentVersion = version
    // }

    // if (!currentChainId) {
    //   currentChainId = chainId
    // }

    // if (!this.smartAccountState) {
    //   this.smartAccountState = smartAccountState
    // } else if (
    //   this.smartAccountState.version !== currentVersion ||
    //   this.smartAccountState.chainId !== currentChainId
    // ) {
    //   this.smartAccountState.address = await this.smartWalletFactoryContract[chainId][
    //     version
    //   ].getAddressForCounterFactualAccount(owner, 0)
    //   this.smartAccountState.version = currentVersion
    //   this.smartAccountState.chainId = currentChainId

    //   this.smartAccountState.isDeployed = await this.isDeployed(
    //     this.smartAccountState.chainId,
    //     address
    //   ) // could be set as state in init
    //   const contractsByVersion = findContractAddressesByVersion(
    //     this.smartAccountState.version,
    //     this.smartAccountState.chainId,
    //     this.chainConfig
    //   )
    //     ; (this.smartAccountState.entryPointAddress = contractsByVersion.entryPointAddress || ''),
    //       (this.smartAccountState.fallbackHandlerAddress =
    //         contractsByVersion.fallBackHandlerAddress || '')
    // }

    // return this.smartAccountState
  }

  attachWalletContract(
    chainId: ChainId,
    version: SmartAccountVersion,
    address: string
  ) {
    let walletContract = this.smartWalletContract[chainId][version].getContract()
    return walletContract.attach(address)
  }

  /*attachCallbackHandlerContract(
    chainId: ChainId,
    version: SmartAccountVersion,
    address: string
  ) {
    let handlerContract = this.defaultCallbackHandlerContract[chainId][version].getContract()
    return handlerContract.attach(address)
  }*/

}

export default ContractUtils
