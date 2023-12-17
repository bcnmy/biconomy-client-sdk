import { UserOpResponse, UserOpGasResponse, UserOpReceipt, UserOpByHashResponse, SendUserOpOptions, GasFeeValues } from "../utils/Types";
import { UserOperationStruct } from "@alchemy/aa-core";

export interface IBundler {
  estimateUserOpGas(_userOp: Partial<UserOperationStruct>): Promise<UserOpGasResponse>;
  sendUserOp(_userOp: UserOperationStruct, _simulationParam?: SendUserOpOptions): Promise<UserOpResponse>;
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>;
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>;
  getGasFeeValues(): Promise<GasFeeValues>;
}
