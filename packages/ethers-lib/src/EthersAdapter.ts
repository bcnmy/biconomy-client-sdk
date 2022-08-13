import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Provider, JsonRpcProvider } from '@ethersproject/providers'
import {
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SmartWalletContract
} from '@biconomy-sdk/core-types'
import { validateEip3770Address } from '@gnosis.pm/safe-core-sdk-utils'
import { ethers } from 'ethers'
import {
  getMultiSendContractInstance,
  getMultiSendCallOnlyContractInstance,
  getSmartWalletContractInstance,
  getSmartWalletFactoryContractInstance
} from './contracts/contractInstancesEthers'
import SmartWalletProxyFactoryEthersContract from './contracts/SmartWalletFactory/SmartWalletProxyFactoryEthersContract'
import MultiSendEthersContract from './contracts/MultiSend/MultiSendEthersContract'
import MultiSendCallOnlyEthersContract from './contracts/MultiSendCallOnly/MultiSendCallOnlyEthersContract'

type Ethers = typeof ethers

export interface EthersAdapterConfig {
  /** ethers - Ethers v5 library */
  ethers: Ethers
  /** signer - Ethers signer */
  signer: Signer

  provider: JsonRpcProvider
}

class EthersAdapter implements EthAdapter {
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
    //this.#provider = signer.provider
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

  getSmartWalletContract(address: string): SmartWalletContract {
    if (!address) {
      throw new Error('Invalid Smart Wallet contract address')
    }
    return getSmartWalletContractInstance(address, this.#provider)
  }

  getMultiSendContract(address: string): MultiSendEthersContract {
    if (!address) {
      throw new Error('Invalid Multi Send contract address')
    }
    return getMultiSendContractInstance(address, this.#provider)
  }

  getMultiSendCallOnlyContract(address: string): MultiSendCallOnlyEthersContract {
    if (!address) {
      throw new Error('Invalid Multi Send contract address')
    }
    return getMultiSendCallOnlyContractInstance(address, this.#provider)
  }

  getSmartWalletFactoryContract(address: string): SmartWalletProxyFactoryEthersContract {
    if (!address) {
      throw new Error('Invalid Wallet Factory contract address')
    }
    return getSmartWalletFactoryContractInstance(address, this.#provider)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#provider.getCode(address)
  }

  async isContractDeployed(address: string): Promise<boolean> {
    const contractCode = await this.#provider.getCode(address)
    return contractCode !== '0x'
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
  async estimateGas(transaction: EthAdapterTransaction): Promise<number> {
    return (await this.#provider.estimateGas(transaction)).toNumber()
  }

  call(transaction: EthAdapterTransaction): Promise<string> {
    return this.#provider.call(transaction)
  }
}

export default EthersAdapter
