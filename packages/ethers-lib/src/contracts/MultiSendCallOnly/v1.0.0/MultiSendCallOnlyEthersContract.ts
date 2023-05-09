import { MultiSendCallOnlyContract } from '@biconomy/core-types'
import {
  MultiSendCallOnlyContract_v1_0_0 as MultiSendCallOnly_TypeChain,
  MultiSendCallOnlyContract_v1_0_0Interface as MultiSendCallOnlyContractV100Interface
} from '../../../../typechain/src/ethers-v5/v1.0.0/MultiSendCallOnlyContract_v1_0_0'
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
