import { MultiSendCallOnlyContract } from '@biconomy-devx/core-types'
import {
  MultiSendCallOnlyContractV100 as MultiSendCallOnly_TypeChain,
  MultiSendCallOnlyContractV100Interface
} from '../../../../typechain/src/ethers-v5/v1.0.0/MultiSendCallOnlyContractV100'
import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'

class MultiSendCallOnlyEthersContract implements MultiSendCallOnlyContract {
  constructor(public contract: MultiSendCallOnly_TypeChain) {}

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
  encode: MultiSendCallOnlyContractV100Interface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendCallOnlyEthersContract
