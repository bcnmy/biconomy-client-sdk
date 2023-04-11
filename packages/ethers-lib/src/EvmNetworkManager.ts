import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  Eip3770Address,
  IEvmNetworkManager,
  IEvmNetworkManagerTransaction,
  SmartAccountVersion,
  SmartWalletContract
} from '@biconomy-devx/core-types'
import { validateEip3770Address } from '@gnosis.pm/safe-core-sdk-utils'
import { ethers } from 'ethers'
import {
  getMultiSendContractInstance,
  getMultiSendCallOnlyContractInstance,
  getSmartWalletContractInstance,
  getSmartWalletFactoryContractInstance,
  getFallbackGasTankContractInstance,
  getDefaultCallbackHandlerInstance
} from './contracts/contractInstancesEthers'
type Ethers = typeof ethers

export interface EthersAdapterConfig {
  /** ethers - Ethers v5 library */
  ethers: Ethers
  /** signer - Ethers signer */
  signer: Signer

  provider: JsonRpcProvider
}

class EvmNetworkManager implements IEvmNetworkManager {
  #ethers: Ethers
  #signer: Signer
  #provider: JsonRpcProvider

  constructor({ ethers, signer, provider }: EthersAdapterConfig) {
    if (!ethers) {
      throw new Error('ethers property missing from options')
    }
    if (!signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    this.#signer = signer
    this.#provider = provider
    this.#ethers = ethers
  }

  // Review
  getProvider(): JsonRpcProvider {
    return this.#provider
  }

  getSigner(): Signer {
    return this.#signer
  }

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, chainId)
  }

  async getBalance(address: string): Promise<BigNumber> {
    return BigNumber.from(await this.#provider.getBalance(address))
  }

  async getChainId(): Promise<number> {
    return (await this.#provider.getNetwork()).chainId
  }

  getSmartWalletContract(
    smartAccountVersion: SmartAccountVersion,
    address: string
  ): SmartWalletContract {
    if (!address) {
      throw new Error('Invalid Smart Wallet contract address')
    }
    return getSmartWalletContractInstance(smartAccountVersion, address, this.#provider)
  }

  getMultiSendContract(smartAccountVersion: SmartAccountVersion, address: string) {
    if (!address) {
      throw new Error('Invalid Multi Send contract address')
    }
    return getMultiSendContractInstance(smartAccountVersion, address, this.#provider)
  }

  getMultiSendCallOnlyContract(smartAccountVersion: SmartAccountVersion, address: string) {
    if (!address) {
      throw new Error('Invalid Multi Send Call Only contract address')
    }
    return getMultiSendCallOnlyContractInstance(smartAccountVersion, address, this.#provider)
  }

  getSmartWalletFactoryContract(smartAccountVersion: SmartAccountVersion, address: string) {
    if (!address) {
      throw new Error('Invalid Wallet Factory contract address')
    }
    return getSmartWalletFactoryContractInstance(smartAccountVersion, address, this.#provider)
  }

  getFallbackGasTankContract(smartAccountVersion: SmartAccountVersion, address: string) {
    if (!address) {
      throw new Error('Invalid Fallback Gas Tank contract address')
    }
    return getFallbackGasTankContractInstance(smartAccountVersion, address, this.#provider)
  }

  getDefaultCallbackHandlerContract(smartAccountVersion: SmartAccountVersion, address: string) {
    if (!address) {
      throw new Error('Invalid Default Callback Handler contract address')
    }
    return getDefaultCallbackHandlerInstance(smartAccountVersion, address, this.#provider)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#provider.getCode(address)
  }

  async isContractDeployed(address: string): Promise<boolean> {
    let contractCode
    try {
      contractCode = await this.#provider.getCode(address)
      return contractCode !== '0x'
    } catch (error) {
      throw new Error('Unable to get Contract details')
    }
  }

  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.#provider.getTransaction(transactionHash)
  }

  async getSignerAddress(): Promise<string> {
    return this.#signer.getAddress()
  }

  signMessage(message: string): Promise<string> {
    const messageArray = this.#ethers.utils.arrayify(message)
    return this.#signer.signMessage(messageArray)
  }

  // Review
  async estimateGas(transaction: IEvmNetworkManagerTransaction): Promise<number> {
    return (await this.#provider.estimateGas(transaction)).toNumber()
  }

  call(transaction: IEvmNetworkManagerTransaction): Promise<string> {
    return this.#provider.call(transaction)
  }
}

export default EvmNetworkManager
