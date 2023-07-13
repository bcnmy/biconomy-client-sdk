import { UserOperation } from '@biconomy/core-types'
import {
  FeeQuotesOrDataResponse,
  BiconomyTokenPaymasterRequest,
  FeeQuotesOrDataDto,
  PaymasterAndDataResponse
} from '../utils/Types'
import { Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import { IPaymaster } from './IPaymaster'

export interface IHybridPaymaster<T> extends IPaymaster {
  getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: T
  ): Promise<PaymasterAndDataResponse>
  getDummyPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: T
  ): Promise<string>
  buildTokenApprovalTransaction(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction>
  getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperation>,
    paymasterServiceData: FeeQuotesOrDataDto
  ): Promise<FeeQuotesOrDataResponse>
}
