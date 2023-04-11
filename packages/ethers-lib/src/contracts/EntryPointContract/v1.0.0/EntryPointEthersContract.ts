import { EntryPointContract, UserOperation, ITransactionResult } from '@biconomy-devx/core-types'
import { EntryPointContractV100 as EntryPointContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.0/EntryPointContractV100'
import { toTxResult } from '../../../utils'
import { Contract } from '@ethersproject/contracts'
import { BytesLike } from 'ethers'
class EntryPointEthersContract implements EntryPointContract {
  constructor(public contract: EntryPointContract_TypeChain) {}

  getAddress(): string {
    return this.contract.address
  }

  async getSenderAddress(initCode: BytesLike): Promise<ITransactionResult> {
    const resultSet = await this.contract.getSenderAddress(initCode)
    return toTxResult(resultSet)
  }

  getContract(): Contract {
    return this.contract
  }

  async simulateValidation(userOperation: UserOperation): Promise<ITransactionResult> {
    const resultSet = await this.contract.simulateValidation(userOperation)
    return toTxResult(resultSet)
  }

  async getUserOpHash(userOperation: UserOperation): Promise<string> {
    return this.contract.getUserOpHash(userOperation)
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
