import { SmartWalletFactoryContract, TransactionResult } from 'core-types'
import { toTxResult } from '../../utils'
import { SmartWalletFactoryContract as SmartWalletFactoryContract_TypeChain } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFactoryContract'

class SmartWalletFacoryContractEthers implements SmartWalletFactoryContract {
  constructor(public contract: SmartWalletFactoryContract_TypeChain) {}

  getAddress(): string {
    return this.contract.address
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

export default SmartWalletFacoryContractEthers
