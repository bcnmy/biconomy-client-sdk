import { SendUserOpResponse, getUserOpGasPricesResponse } from "../types/Bundler.types"
import { ChainId,UserOperation  } from '@biconomy/core-types'

export interface IBundler {
    getUserOpGasPrices(userOp: Partial<UserOperation>, chainId: ChainId): Promise<getUserOpGasPricesResponse>
    sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<SendUserOpResponse>
}