import { MultiSendContract } from '@biconomy-sdk/core-types'
import {
  MultiSendContractV101 as MultiSend_TypeChain,
  MultiSendContractV101Interface
} from '../../../../typechain/src/ethers-v5/v1.0.1/MultiSendContractV101'
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

  encode: MultiSendContractV101Interface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersContract
