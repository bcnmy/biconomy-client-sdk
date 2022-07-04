import {
  SmartWalletFacoryContract, TransactionResult,
} from 'core-types'
import { toTxResult } from '../../utils'
import { SmartWalletFactoryContract as SmartWalletFacoryContract_TypeChain } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFactoryContract'


class SmartWalletFacoryContractEthers implements SmartWalletFacoryContract {
  constructor(public contract: SmartWalletFacoryContract_TypeChain) {}

  async deployCounterFactualWallet(owner:string, entryPoint:string, handler:string, index:number): Promise<TransactionResult>{
    const resultSet = await this.contract.deployCounterFactualWallet(owner, entryPoint, handler, index)
    return toTxResult(resultSet)
  }

  async deployWallet(owner:string, entryPoint:string, handler:string): Promise<TransactionResult>{
    const resultSet = await this.contract.deployWallet(owner, entryPoint, handler)
    return toTxResult(resultSet)
  }

  async getAddressForCounterfactualWallet(owner:string, index:number): Promise<string>{
    return this.contract.getAddressForCounterfactualWallet(owner, index)
  }

}

export default SmartWalletFacoryContractEthers
