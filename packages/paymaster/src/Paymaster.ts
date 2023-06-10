import { UserOperation } from '@biconomy/core-types'
import { PaymasterServiceDataType } from './types/Types'

// TODO
// Review: This might be called PaymasterAPI and all other calsses and interfaces have this suffix
// Review: class vs abstract class vs interface

export class PaymasterAPI<T = PaymasterServiceDataType> {
  paymasterAddress?: string

  async getPaymasterAndData(
    _userOp: Partial<UserOperation>,
    _paymasterServiceData?: T
  ): Promise<string> {
    return '0x'
  }
}
