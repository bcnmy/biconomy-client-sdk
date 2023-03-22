import { DefaultCallbackHandlerContract, UserOperation, ITransactionResult } from '@biconomy/core-types'
import { DefaultCallbackHandlerV100 as DefaultCallbackHandlerContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.0/DefaultCallbackHandlerContractV100'
import { toTxResult } from '../../../utils'
import { Contract } from '@ethersproject/contracts'
import { BytesLike } from 'ethers'
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

  async getMessageHash(message: BytesLike): Promise<string> {
    return this.contract.getMessageHash(message)
  }

  async isValidSignature(_dataHash: string, _signature: string): Promise<BytesLike> {
    return this.contract.isValidSignature(_dataHash, _signature)
  }

}

export default DefaultCallbackHandlerEthersContract
