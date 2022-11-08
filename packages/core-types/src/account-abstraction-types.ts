import { UserOperation } from 'types'

export interface IPaymasterAPI {
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}
