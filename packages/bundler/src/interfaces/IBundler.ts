import { UserOpResponse, UserOpGasResponse, UserOpReceipt, UserOpByHashResponse } from '../types/Types'
import { ChainId, UserOperation } from '@biconomy/core-types'

export interface IBundler {
    estimateUserOpGas(
        userOp: Partial<UserOperation>,
        chainId: ChainId
    ): Promise<UserOpGasResponse>
    sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<UserOpResponse>
    getUserOpReceipt(userOpHash: string, chainId: ChainId): Promise<UserOpReceipt>
    getUserOpByHash(userOpHash: string, chainId: ChainId): Promise<UserOpByHashResponse>
}
