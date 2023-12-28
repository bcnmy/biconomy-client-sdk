import { UserOpResponse, UserOpGasResponse, UserOpReceipt, UserOpByHashResponse, GasFeeValues, UserOpStatus, SimulationType } from "../utils/Types";
import { UserOperation } from "@biconomy-devx/core-types";

export interface IBundler {
  estimateUserOpGas(_userOp: Partial<UserOperation>): Promise<UserOpGasResponse>;
  // could have second arg object called options
  sendUserOp(_userOp: UserOperation, _simulationType?: SimulationType): Promise<UserOpResponse>;
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>;
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>;
  getGasFeeValues(): Promise<GasFeeValues>;
  getUserOpStatus(_userOpHash: string): Promise<UserOpStatus>;
}
