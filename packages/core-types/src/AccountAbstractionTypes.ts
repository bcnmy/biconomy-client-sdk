import { UserOperation } from 'Types'

export interface IPaymasterAPI {
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}
