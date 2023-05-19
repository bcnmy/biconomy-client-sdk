import { UserOpResponse, UserOpGasPricesResponse } from "../types/Types"
import { ChainId, UserOperation  } from '@biconomy/core-types'

export interface IBundler {
    getUserOpGasFields(userOp: Partial<UserOperation>, chainId: ChainId): Promise<UserOpGasPricesResponse>
    sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<UserOpResponse>
}