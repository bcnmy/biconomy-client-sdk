import { UserOperation } from 'Types'
import { PaymasterServiceDataType } from './PaymasterServiceTypes'

// marked for deletion
export interface IPaymasterAPI {
  getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: PaymasterServiceDataType
  ): Promise<string>
}

export type PaymasterConfig = {
  paymasterUrl: string
  strictSponsorshipMode: boolean
  // could be added more details. Todo Review: if we're intialising with one instance with fixed token
}
