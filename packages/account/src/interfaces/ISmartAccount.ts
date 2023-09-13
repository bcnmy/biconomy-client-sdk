import { UserOperation } from "@biconomy/core-types";
import { UserOpResponse } from "@biconomy/bundler";
export interface ISmartAccount {
  getSmartAccountAddress(accountIndex: number): Promise<string>;
  signUserOp(userOp: UserOperation): Promise<UserOperation>;
  sendUserOp(userOp: UserOperation): Promise<UserOpResponse>;
  sendSignedUserOp(userOp: UserOperation): Promise<UserOpResponse>;
}
