import { UserOperation, TransactionResult } from '../types'

export interface EntryPointContract {
  handleOps(userOperations: UserOperation[], beneficiary: string): Promise<TransactionResult>
  simulateValidation(userOperation: UserOperation): Promise<TransactionResult>
  getRequestId(userOperation: UserOperation): Promise<string>
  getSenderAddress(initCode: string, salt: number): Promise<string>
}
