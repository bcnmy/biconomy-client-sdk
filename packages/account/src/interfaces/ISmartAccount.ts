import { UserOperation } from '@biconomy/core-types'
import { UserOpResponse } from '@biconomy/bundler'
export interface ISmartAccount {
  getSmartAccountAddress(accountIndex: number): Promise<string>
  signUserOp(userOperation: UserOperation): Promise<UserOperation>
  sendUserOp(userOperation: UserOperation): Promise<UserOpResponse>
  sendSignedUserOp(userOperation: UserOperation): Promise<UserOpResponse>
}
