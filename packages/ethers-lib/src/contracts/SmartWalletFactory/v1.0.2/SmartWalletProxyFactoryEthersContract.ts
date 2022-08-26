import { SmartWalletFactoryContract, TransactionResult } from '@biconomy-sdk/core-types'
import { toTxResult } from '../../../utils'
import { SmartWalletFactoryContractV102 as SmartWalletFactoryContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.2/SmartWalletFactoryContractV102'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'

class SmartWalletFactoryContractEthers implements SmartWalletFactoryContract {
  constructor(public contract: SmartWalletFactoryContract_TypeChain) {}

  getInterface(): Interface {
    return this.contract.interface
  }

  getContract(): Contract {
    return this.contract
  }

  async isWalletExist(wallet: string): Promise<boolean> {
    const doesExist = await this.contract.isWalletExist(wallet)
    return doesExist
  }

  getAddress(): string {
    return this.contract.address
  }

  setAddress(address: string) {
    this.contract.attach(address)
  }

  async deployCounterFactualWallet(
    owner: string,
    entryPoint: string,
    handler: string,
    index: number
  ): Promise<TransactionResult> {
    const resultSet = await this.contract.deployCounterFactualWallet(
      owner,
      entryPoint,
      handler,
      index
    )
    return toTxResult(resultSet)
  }

  async deployWallet(
    owner: string,
    entryPoint: string,
    handler: string
  ): Promise<TransactionResult> {
    const resultSet = await this.contract.deployWallet(owner, entryPoint, handler)
    return toTxResult(resultSet)
  }

  async getAddressForCounterfactualWallet(owner: string, index: number): Promise<string> {
    return this.contract.getAddressForCounterfactualWallet(owner, index)
  }
}

export default SmartWalletFactoryContractEthers
