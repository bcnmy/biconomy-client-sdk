import { UserOperation } from '../Types'
import { ITransactionResult } from '../TransactionTypes'
import { Contract } from '@ethersproject/contracts'
import { BytesLike } from 'ethers'
export interface EntryPointContract {
  getAddress(): string
  getSenderAddress(initCode: BytesLike): Promise<ITransactionResult>
  getContract(): Contract
  handleOps(userOperations: UserOperation[], beneficiary: string): Promise<ITransactionResult>
  simulateValidation(
    userOperation: UserOperation,
    offChainSigCheck: boolean
  ): Promise<ITransactionResult>
  // getRequestId(userOperation: UserOperation): Promise<string>
}
