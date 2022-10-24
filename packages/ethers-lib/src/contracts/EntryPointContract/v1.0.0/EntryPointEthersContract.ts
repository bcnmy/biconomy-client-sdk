import { EntryPointContract, UserOperation, ITransactionResult } from '@biconomy-sdk/core-types'
import {
  EntryPointContractV100 as EntryPointContract_TypeChain,
  EntryPointContractV100Interface
} from '../../../../typechain/src/ethers-v5/v1.0.0/EntryPointContractV100'
import { toTxResult } from '../../../utils'
import { Contract } from '@ethersproject/contracts'

class EntryPointEthersContract implements EntryPointContract {
  constructor(public contract: EntryPointContract_TypeChain) {}

  getAddress(): string {
    return this.contract.address
  }

  getContract(): Contract {
    return this.contract
  }

  async simulateValidation(userOperation: UserOperation, offChainSigCheck: boolean): Promise<ITransactionResult> {
    const resultSet = await this.contract.simulateValidation(userOperation, offChainSigCheck)
    return toTxResult(resultSet)
  }

  async getRequestId(userOperation: UserOperation): Promise<string> {
    return this.contract.getRequestId(userOperation)
  }

  async handleOps(
    userOperations: UserOperation[],
    beneficiary: string
  ): Promise<ITransactionResult> {
    const resultSet = await this.contract.handleOps(userOperations, beneficiary)
    return toTxResult(resultSet)
  }
}

export default EntryPointEthersContract
