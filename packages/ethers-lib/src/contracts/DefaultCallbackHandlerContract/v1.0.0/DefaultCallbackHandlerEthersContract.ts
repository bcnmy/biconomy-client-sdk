import { DefaultCallbackHandlerContract } from '@biconomy-devx/core-types'
import { DefaultCallbackHandlerV100 as DefaultCallbackHandlerContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.0/DefaultCallbackHandlerV100'
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
