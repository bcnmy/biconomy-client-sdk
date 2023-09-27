import { UserOperation } from "@biconomy/core-types";
import { PaymasterAndDataResponse, UserOpGasResponse } from "../utils/Types";

export interface IPaymaster {
  // Implementing class may add extra parameter (for example paymasterServiceData with it's own type) in below function signature
  estimateUserOpGas(_userOp: Partial<UserOperation>): Promise<UserOpGasResponse>;
  getPaymasterAndData(_userOp: Partial<UserOperation>): Promise<PaymasterAndDataResponse>;
  getDummyPaymasterAndData(_userOp: Partial<UserOperation>): Promise<string>;
}
