import { UserOperation } from '../types'
import { ITransactionResult } from '../transaction.types'
import { Contract } from '@ethersproject/contracts'

export interface EntryPointContract {
  getContract(): Contract
  handleOps(userOperations: UserOperation[], beneficiary: string): Promise<ITransactionResult>
  simulateValidation(userOperation: UserOperation, offChainSigCheck: boolean): Promise<ITransactionResult>
  getRequestId(userOperation: UserOperation): Promise<string>
}
