import { UserOperation } from '@biconomy/core-types'
import { PaymasterAndDataResponse } from '../utils/Types'

export interface IPaymaster {
  // Implementing class may add extra parameter (for example paymasterServiceData with it's own type) in below function signature
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<PaymasterAndDataResponse>
  getDummyPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}
