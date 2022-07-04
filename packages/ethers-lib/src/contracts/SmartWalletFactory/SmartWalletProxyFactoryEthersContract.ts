import {
  SmartAccountVersion,
  SmartWalletFacoryContract,
  SmartAccountTrx,
  SmartAccountTrxData,
  TransactionOptions,
  FeeRefundData,
  TransactionResult
} from 'core-types'

import { SmartWalletFacoryContractSV100 as SmartWalletFacoryContract_V1_0_0 } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFacoryContractSV100'
import { SmartWalletFacoryContractSV100Interface } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletFacoryContractSV100'


class SmartWalletFacoryContractEthers implements SmartWalletFacoryContract {
  constructor(public contract: SmartWalletFacoryContract_V1_0_0) {}

  async deployCounterFactualWallet(owner:string, entryPointL:string, handler:string, index:number): Promise<string>{
    return ""
  }

  async deployWallet(owner:string, entryPointL:string, handler:string): Promise<string>{
    return ""
  }

  async getAddressForCounterfactualWallet(owner:string, index:number): Promise<string>{
    return ""
  }

}

export default SmartWalletFacoryContractEthers
