import { MultiSendContract } from '@biconomy/core-types'
import {
  MultiSendContract_v1_0_0 as MultiSend_TypeChain,
  MultiSendContract_v1_0_0Interface as MultiSendContractV100Interface
} from '../../../../typechain/src/ethers-v5/v1.0.0/MultiSendContract_v1_0_0'
import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'

class MultiSendEthersContract implements MultiSendContract {
  constructor(public contract: MultiSend_TypeChain) {}

  getAddress(): string {
    return this.contract.address
  }

  getContract(): Contract {
    return this.contract
  }

  getInterface(): Interface {
    return this.contract.interface
  }
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  encode: MultiSendContractV100Interface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersContract
