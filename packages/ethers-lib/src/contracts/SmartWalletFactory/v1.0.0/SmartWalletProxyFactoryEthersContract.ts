import { SmartWalletFactoryContract, ITransactionResult } from '@biconomy-devx/core-types'
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

  async deployCounterFactualAccount(owner: string, index: number): Promise<ITransactionResult> {
    const resultSet = await this.contract.deployCounterFactualAccount(owner, index)
    return toTxResult(resultSet)
  }

  async deployAccount(owner: string): Promise<ITransactionResult> {
    const resultSet = await this.contract.deployAccount(owner)
    return toTxResult(resultSet)
  }

  async getAddressForCounterFactualAccount(owner: string, index: number): Promise<string> {
    return this.contract.getAddressForCounterFactualAccount(owner, index)
  }
}

export default SmartWalletFactoryContractEthers
