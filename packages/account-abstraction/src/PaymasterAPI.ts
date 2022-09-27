import { UserOperationStruct } from '@account-abstraction/contracts'

export class PaymasterAPI {
  async getPaymasterAndData (userOp: Partial<UserOperationStruct>): Promise<string> {
    console.log(userOp)
    return '0x'
  }
}
