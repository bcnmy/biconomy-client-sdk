import { UserOperation } from '@biconomy/core-types'

export interface ISmartAccount {
    getSmartAccountAddress(): string
    signUserOp(userOperation: UserOperation): Promise<UserOperation>
    sendUserOp(userOperation: UserOperation): Promise<void>
    sendSignedUserOp(userOperation: UserOperation): Promise<void>
}