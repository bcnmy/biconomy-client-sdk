import {
  SmartWalletFacoryContract, TransactionResult,
} from 'core-types'
import { toTxResult } from '../../utils'
import { ContractTransaction } from '@ethersproject/contracts'

import { SmartWalletFacoryContractSV100 as SmartWalletFacoryContract_V1_0_0 } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFacoryContractSV100'
import { SmartWalletFacoryContractSV100Interface } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFacoryContractSV100'


class SmartWalletFacoryContractEthers implements SmartWalletFacoryContract {
  constructor(public contract: SmartWalletFacoryContract_V1_0_0) {}

  async deployCounterFactualWallet(owner:string, entryPointL:string, handler:string, index:number): Promise<TransactionResult>{
    const resultSet = await this.contract.deployCounterFactualWallet(owner, entryPointL, handler, index)
    return toTxResult(resultSet)
  }

  async deployWallet(owner:string, entryPointL:string, handler:string): Promise<TransactionResult>{
    const resultSet = await this.contract.deployWallet(owner, entryPointL, handler)
    return toTxResult(resultSet)
  }

  async getAddressForCounterfactualWallet(owner:string, index:number): Promise<string>{
    return this.contract.getAddressForCounterfactualWallet(owner, index)
  }

}

export default SmartWalletFacoryContractEthers
