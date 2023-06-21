import { UserOperation } from '@biconomy/core-types'
import {
  BiconomyTokenPaymasterFeeQuoteResponse,
  BiconomyTokenPaymasterRequest,
  FeeQuotesOrDataDto
} from '../types/Types'
import { Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'


export interface IPaymaster {
  // Implementing class may add extra parameter (for example paymasterServiceData with it's own type) in below function signature
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}
