import { UserOperation } from '@biconomy/core-types'
import { BiconomyTokenPaymasterRequest } from '../types/Types'
import { Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'

// TODO: Not sure if we need this interface
export interface IPaymaster {
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
  createTokenApprovalRequest(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction>
}
