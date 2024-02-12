import { type UserOperationStruct } from "@alchemy/aa-core";
import {
  FeeQuotesOrDataResponse,
  BiconomyTokenPaymasterRequest,
  FeeQuotesOrDataDto,
  PaymasterAndDataResponse,
  type Transaction,
} from "../utils/Types.js";
import { IPaymaster } from "./IPaymaster.js";

export interface IHybridPaymaster<T> extends IPaymaster {
  getPaymasterAndData(_userOp: Partial<UserOperationStruct>, _paymasterServiceData?: T): Promise<PaymasterAndDataResponse>;
  getDummyPaymasterAndData(_userOp: Partial<UserOperationStruct>, _paymasterServiceData?: T): Promise<string>;
  buildTokenApprovalTransaction(_tokenPaymasterRequest: BiconomyTokenPaymasterRequest): Promise<Transaction>;
  getPaymasterFeeQuotesOrData(_userOp: Partial<UserOperationStruct>, _paymasterServiceData: FeeQuotesOrDataDto): Promise<FeeQuotesOrDataResponse>;
}
