import { UserOperation } from "@biconomy/core-types";
import { FeeQuotesOrDataResponse, BiconomyTokenPaymasterRequest, FeeQuotesOrDataDto } from "../utils/Types";
import { PaymasterAndDataResponse, PmServiceDto, UserOpGasResponse } from "../utils/Types";
import { Transaction } from "@biconomy/core-types";
import { Provider } from "@ethersproject/abstract-provider";
import { IPaymaster } from "./IPaymaster";

export interface IHybridPaymaster<T> extends IPaymaster {
  getPaymasterAndData(_userOp: Partial<UserOperation>, _paymasterServiceData?: T): Promise<PaymasterAndDataResponse>;
  getDummyPaymasterAndData(_userOp: Partial<UserOperation>, _paymasterServiceData?: T): Promise<string>;
  estimateUserOpGas(_userOp: Partial<UserOperation>, _paymasterServiceData?: PmServiceDto): Promise<UserOpGasResponse>;
  buildTokenApprovalTransaction(_tokenPaymasterRequest: BiconomyTokenPaymasterRequest, _provider: Provider): Promise<Transaction>;
  getPaymasterFeeQuotesOrData(_userOp: Partial<UserOperation>, _paymasterServiceData: FeeQuotesOrDataDto): Promise<FeeQuotesOrDataResponse>;
}
