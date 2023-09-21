import { UserOperation } from "@biconomy/core-types";
import { UserOpResponse } from "@biconomy/bundler";
export interface ISmartAccount {
  getSmartAccountAddress(_accountIndex: number): Promise<string>;
  signUserOp(_userOp: UserOperation): Promise<UserOperation>;
  sendUserOp(_userOp: UserOperation): Promise<UserOpResponse>;
  sendSignedUserOp(_userOp: UserOperation): Promise<UserOpResponse>;
}
