import {
  UserOpResponse,
  UserOpGasResponse,
  UserOpReceipt,
  UserOpByHashResponse,
  SendUserOpOptions,
  GasFeeValues,
  UserOpStatus,
} from "../utils/Types";
import { UserOperation } from "@biconomy-devx/core-types";

export interface IBundler {
  estimateUserOpGas(_userOp: Partial<UserOperation>): Promise<UserOpGasResponse>;
  sendUserOp(_userOp: UserOperation, _simulationParam?: SendUserOpOptions): Promise<UserOpResponse>;
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>;
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>;
  getGasFeeValues(): Promise<GasFeeValues>;
  getUserOpStatus(_userOpHash: string): Promise<UserOpStatus>;
}
