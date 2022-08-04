import { UserOperation } from '../types'
import { TransactionResult } from '../transaction.types'
import { Contract } from '@ethersproject/contracts'

export interface EntryPointContract {
  getContract(): Contract
  handleOps(userOperations: UserOperation[], beneficiary: string): Promise<TransactionResult>
  simulateValidation(userOperation: UserOperation): Promise<TransactionResult>
  getRequestId(userOperation: UserOperation): Promise<string>
  getSenderAddress(initCode: string, salt: number): Promise<string>
}
