import { EntryPointContract, UserOperation, ITransactionResult } from '@biconomy-sdk/core-types'
import {
  EntryPointContractV101 as EntryPointContract_TypeChain,
  EntryPointContractV101Interface
} from '../../../../typechain/src/ethers-v5/v1.0.1/EntryPointContractV101'
import { toTxResult } from '../../../utils'
import { Contract } from '@ethersproject/contracts'
import { BytesLike, ContractTransaction } from 'ethers'
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

  async simulateValidation(
    userOperation: UserOperation,
    offChainSigCheck: boolean
  ): Promise<ITransactionResult> {
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
