/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserOperation } from '@biconomy/core-types'
import { PaymasterServiceDataType } from '@biconomy/core-types'

export interface IPaymasterAPI {
  getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: PaymasterServiceDataType
  ): Promise<string>
}

// Note: Review: Should be able to send any information erc20Token or deadlines etc as part of paymasterServiceData
// Could return Promise<object | undefined> in case we expect the service to return more

/**
 * an API to external a UserOperation with paymaster info
 */
export class PaymasterAPI {
  /**
   * @param _userOp a partially-filled UserOperation (without signature and paymasterAndData
   * @returns the paymasterAndData string
   */
  async getPaymasterAndData(
    _userOp: Partial<UserOperation>,
    _paymasterServiceData?: PaymasterServiceDataType
  ): Promise<string> {
    return '0x'
  }
}
