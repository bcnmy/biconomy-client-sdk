import { UserOperation } from '@biconomy-devx/core-types'
import { UserOpResponse } from '@biconomy-devx/bundler'
export interface ISmartAccount {
  getSmartAccountAddress(accountIndex: number): Promise<string>
  signUserOp(userOp: UserOperation): Promise<UserOperation>
  sendUserOp(userOp: UserOperation): Promise<UserOpResponse>
  sendSignedUserOp(userOp: UserOperation): Promise<UserOpResponse>
}
