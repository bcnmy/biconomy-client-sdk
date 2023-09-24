import { UserOpResponse, UserOpGasResponse, UserOpReceipt, UserOpByHashResponse } from "../utils/Types";
import { UserOperation } from "@biconomy-devx/core-types";

export interface IBundler {
  estimateUserOpGas(_userOp: Partial<UserOperation>): Promise<UserOpGasResponse>;
  sendUserOp(_userOp: UserOperation): Promise<UserOpResponse>;
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>;
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>;
}
