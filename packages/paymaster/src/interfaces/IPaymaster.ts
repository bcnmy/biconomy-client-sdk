import { UserOperation } from '@biconomy/core-types'

export interface IPaymaster {
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}
