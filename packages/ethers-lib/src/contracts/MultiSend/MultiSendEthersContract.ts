import { MultiSendContract } from 'core-types'
import {
  MultiSendSV100 as MultiSend_V1_0_0,
  MultiSendSV100Interface
} from '../../../typechain/src/ethers-v5/v1.0.0/MultiSendSV100'

class MultiSendEthersContract implements MultiSendContract {
  constructor(public contract: MultiSend_V1_0_0) {}

  encode: MultiSendSV100Interface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersContract
