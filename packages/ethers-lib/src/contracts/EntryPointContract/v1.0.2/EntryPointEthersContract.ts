import { EntryPointContract, UserOperation, TransactionResult } from '@biconomy-sdk/core-types'
import {
  EntryPointContractV102 as EntryPointContract_TypeChain,
  EntryPointContractV102Interface
} from '../../../../typechain/src/ethers-v5/v1.0.2/EntryPointContractV102'
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

  async simulateValidation(userOperation: UserOperation): Promise<TransactionResult> {
    const resultSet = await this.contract.simulateValidation(userOperation)
    return toTxResult(resultSet)
  }

  async getRequestId(userOperation: UserOperation): Promise<string> {
    return this.contract.getRequestId(userOperation)
  }

  async handleOps(
    userOperations: UserOperation[],
    beneficiary: string
  ): Promise<TransactionResult> {
    const resultSet = await this.contract.handleOps(userOperations, beneficiary)
    return toTxResult(resultSet)
  }

  async getSenderAddress(initCode: string, salt: number): Promise<string> {
    return this.contract.getSenderAddress(initCode, salt)
  }
}

export default EntryPointEthersContract
