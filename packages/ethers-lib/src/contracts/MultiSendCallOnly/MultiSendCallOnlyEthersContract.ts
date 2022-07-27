import { MultiSendCallOnlyContract } from '@biconomy-sdk/core-types'
import {
  MultiSendCallOnlyContract as MultiSendCallOnly_TypeChain,
  MultiSendCallOnlyContractInterface
} from '../../../typechain/src/ethers-v5/v1.0.0/MultiSendCallOnlyContract'
import { Contract } from '@ethersproject/contracts';
import { Interface } from "@ethersproject/abi";

class MultiSendCallOnlyEthersContract implements MultiSendCallOnlyContract {
  constructor(public contract: MultiSendCallOnly_TypeChain) {}

  getAddress(): string {
    return this.contract.address
  }

  getContract(): Contract {
    return this.contract;
  }

  getInterface(): Interface {
    return this.contract.interface;
  }

  encode: MultiSendCallOnlyContractInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendCallOnlyEthersContract
