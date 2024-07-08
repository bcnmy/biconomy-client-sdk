import type { UserOperationStruct } from "../../account";
import type {
  BiconomyTokenPaymasterRequest,
  Transaction,
} from "../../account/utils/Types.js";
import type {
  FeeQuotesOrDataDto,
  FeeQuotesOrDataResponse,
  PaymasterAndDataResponse,
} from "../utils/Types.js";
import type { IPaymaster } from "./IPaymaster.js";

export interface IHybridPaymaster<T> extends IPaymaster {
  getPaymasterAndData(
    _userOp: Partial<UserOperationStruct>,
    _paymasterServiceData?: T,
  ): Promise<PaymasterAndDataResponse>;
  getDummyPaymasterAndData(
    _userOp: Partial<UserOperationStruct>,
    _paymasterServiceData?: T,
  ): Promise<string>;
  buildTokenApprovalTransaction(
    _tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
  ): Promise<Transaction>;
  getPaymasterFeeQuotesOrData(
    _userOp: Partial<UserOperationStruct>,
    _paymasterServiceData: FeeQuotesOrDataDto,
  ): Promise<FeeQuotesOrDataResponse>;
}
