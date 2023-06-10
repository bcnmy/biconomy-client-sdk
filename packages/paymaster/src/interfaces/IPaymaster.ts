import { UserOperation } from '@biconomy/core-types'

// TODO: Not sure if we need this interface
export interface IPaymaster {
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}
