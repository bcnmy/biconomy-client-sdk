import { SendUserOpResponse, getUserOpGasPricesResponse } from "../types/Bundler.types"
import { ChainId,UserOperation  } from '@biconomy/core-types'

export interface IBundler {
    getUserOpGasPrices(chainId: ChainId): Promise<getUserOpGasPricesResponse>
    sendUserOp(userOp: UserOperation): Promise<SendUserOpResponse>
}