import { UserOperation } from '@biconomy/core-types'
import {
  BiconomyTokenPaymasterFeeQuoteResponse,
  BiconomyTokenPaymasterRequest,
  FeeQuotesOrDataDto
} from '../utils/Types'
import { Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import { IPaymaster } from './IPaymaster'

export interface IHybridPaymaster extends IPaymaster {
  createTokenApprovalRequest(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction>
  getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperation>,
    paymasterServiceData: FeeQuotesOrDataDto
  ): Promise<BiconomyTokenPaymasterFeeQuoteResponse | string>
}
