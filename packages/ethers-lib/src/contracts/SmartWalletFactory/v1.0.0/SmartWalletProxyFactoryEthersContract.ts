import { SmartWalletFactoryContract, ITransactionResult } from '@biconomy/core-types'
import { toTxResult } from '../../../utils'
import { SmartWalletFactoryContractV100 as SmartWalletFactoryContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFactoryContractV100'
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

  getAddress(): string {
    return this.contract.address
  }

  setAddress(address: string) {
    this.contract.attach(address)
  }

  async deployCounterFactualWallet(
    owner: string,
    index: number
  ): Promise<ITransactionResult> {
    const resultSet = await this.contract.deployCounterFactualWallet(
      owner,
      index
    )
    return toTxResult(resultSet)
  }

  async deployWallet(
    owner: string,
  ): Promise<ITransactionResult> {
    const resultSet = await this.contract.deployWallet(owner)
    return toTxResult(resultSet)
  }

  async getAddressForCounterfactualWallet(owner: string, index: number): Promise<string> {
    return this.contract.getAddressForCounterfactualWallet(owner, index)
  }
}

export default SmartWalletFactoryContractEthers
