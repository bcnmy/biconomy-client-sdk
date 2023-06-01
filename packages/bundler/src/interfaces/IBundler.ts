import { UserOpResponse, UserOpGasFieldsResponse, UserOpReceipt } from '../types/Types'
import { ChainId, UserOperation } from '@biconomy/core-types'

export interface IBundler {
    getUserOpGasFields(
        userOp: Partial<UserOperation>,
        chainId: ChainId
    ): Promise<UserOpGasFieldsResponse>
    sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<UserOpResponse>
    getUserOpReceipt(userOpHash: string, chainId: ChainId): Promise<UserOpReceipt>
}
