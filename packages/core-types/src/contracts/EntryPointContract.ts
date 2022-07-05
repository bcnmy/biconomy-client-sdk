import { UserOperation, TransactionResult } from '../types'

export interface EntryPointContract {
  handleOp(userOperation: UserOperation, beneficiary: string): Promise<TransactionResult>
  handleOps(userOperations: UserOperation[], beneficiary: string): Promise<TransactionResult>
  simulateValidation(userOperation: UserOperation): Promise<TransactionResult>
  getRequestId(userOperation: UserOperation): Promise<string>
  getSenderAddress(initCode: string, salt: number): Promise<string>
  isPaymasterStaked(address: string, stake: number): Promise<boolean>
}
