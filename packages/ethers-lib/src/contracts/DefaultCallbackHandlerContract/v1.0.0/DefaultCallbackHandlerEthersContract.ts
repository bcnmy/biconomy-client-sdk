import { DefaultCallbackHandlerContract } from '@biconomy/core-types'
import { DefaultCallbackHandler_v1_0_0 as DefaultCallbackHandlerContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.0/DefaultCallbackHandler_v1_0_0'
import { Contract } from '@ethersproject/contracts'
import { Interface } from 'ethers/lib/utils'
class DefaultCallbackHandlerEthersContract implements DefaultCallbackHandlerContract {
  constructor(public contract: DefaultCallbackHandlerContract_TypeChain) {}

  getAddress(): string {
    return this.contract.address
  }

  getInterface(): Interface {
    return this.contract.interface
  }

  getContract(): Contract {
    return this.contract
  }
}

export default DefaultCallbackHandlerEthersContract
