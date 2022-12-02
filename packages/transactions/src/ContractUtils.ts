import {
  ChainId,
  SmartWalletContract,
  SmartWalletFactoryContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  SmartAccountContext,
  SmartAccountState
} from '@biconomy/core-types'
import { ChainConfig } from '@biconomy/node-client'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract,
  findContractAddressesByVersion
} from './utils/FetchContractsInfo'
import { ethers, Signer } from 'ethers'
import EvmNetworkManager from '@biconomy/ethers-lib'
import { SmartAccountVersion } from '@biconomy/core-types'

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

  smartAccountState!: SmartAccountState

  constructor(readonly chainConfig: ChainConfig[]) {
    this.ethAdapter = {}
    this.smartWalletContract = {}
    this.multiSendContract = {}
    this.multiSendCallOnlyContract = {}
    this.smartWalletFactoryContract = {}
  }

  initializeContracts(
    signer: Signer,
    readProvider: ethers.providers.JsonRpcProvider,
    chaininfo: ChainConfig
  ) {
    // We get the addresses using chainConfig fetched from backend node

    const smartWallet = chaininfo.wallet
    const smartWalletFactoryAddress = chaininfo.walletFactory
    const multiSend = chaininfo.multiSend
    const multiSendCall = chaininfo.multiSendCall
    this.ethAdapter[chaininfo.chainId] = new EvmNetworkManager({
      ethers,
      signer,
      provider: readProvider
    })

    this.smartWalletFactoryContract[chaininfo.chainId] = {}
    this.smartWalletContract[chaininfo.chainId] = {}
    this.multiSendContract[chaininfo.chainId] = {}
    this.multiSendCallOnlyContract[chaininfo.chainId] = {}

    for (let index = 0; index < smartWallet.length; index++) {
      const version = smartWallet[index].version

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

  async isDeployed(chainId: ChainId, version: string, address: string): Promise<boolean> {
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

  async getSmartAccountState(
    smartAccountState: SmartAccountState,
    currentVersion?: string,
    currentChainId?: ChainId
  ): Promise<SmartAccountState> {
    const { address, owner, chainId, version } = smartAccountState

    if (!currentVersion) {
      currentVersion = version
    }

    if (!currentChainId) {
      currentChainId = chainId
    }

    if (!this.smartAccountState) {
      this.smartAccountState = smartAccountState
    } else if (
      this.smartAccountState.version !== currentVersion ||
      this.smartAccountState.chainId !== currentChainId
    ) {
      this.smartAccountState.address = await this.smartWalletFactoryContract[chainId][
        version
      ].getAddressForCounterfactualWallet(owner, 0)
      this.smartAccountState.version = currentVersion
      this.smartAccountState.chainId = currentChainId

      this.smartAccountState.isDeployed = await this.isDeployed(
        this.smartAccountState.chainId,
        this.smartAccountState.version,
        address
      ) // could be set as state in init
      const contractsByVersion = findContractAddressesByVersion(
        this.smartAccountState.version,
        this.smartAccountState.chainId,
        this.chainConfig
      )
      ;(this.smartAccountState.entryPointAddress = contractsByVersion.entryPointAddress || ''),
        (this.smartAccountState.fallbackHandlerAddress =
          contractsByVersion.fallBackHandlerAddress || '')
    }

    return this.smartAccountState
  }
}

export default ContractUtils
