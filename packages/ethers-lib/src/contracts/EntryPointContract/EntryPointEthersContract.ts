import { EntryPointContract, UserOperation, TransactionResult } from '@biconomy-sdk/core-types'
import {
  EntryPointContract as EntryPointContract_TypeChain,
  EntryPointContractInterface
} from '../../../typechain/src/ethers-v5/v1.0.0/EntryPointContract'
import { toTxResult } from '../../utils'

class EntryPointEthersContract implements EntryPointContract {
  constructor(public contract: EntryPointContract_TypeChain) {}

  getAddress(): string {
    return this.contract.address
  }

  async simulateValidation(userOperation: UserOperation): Promise<TransactionResult> {
    const resultSet = await this.contract.simulateValidation(userOperation)
    return toTxResult(resultSet)
  }

  async getRequestId(userOperation: UserOperation): Promise<string> {
    return this.contract.getRequestId(userOperation)
  }

  async handleOp(userOperation: UserOperation, beneficiary: string): Promise<TransactionResult> {
    const resultSet = await this.contract.handleOp(userOperation, beneficiary)
    return toTxResult(resultSet)
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

  async isPaymasterStaked(address: string, stake: number): Promise<boolean> {
    return this.contract.isPaymasterStaked(address, stake)
  }
}

export default EntryPointEthersContract
