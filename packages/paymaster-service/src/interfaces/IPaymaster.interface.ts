import { UserOperation } from '@biconomy/core-types'

export interface IPaymasterAPI {
    getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
  }