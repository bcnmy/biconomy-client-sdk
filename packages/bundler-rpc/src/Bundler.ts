import { IBundler } from "./interfaces/IBundler.interface";
import { UserOperation, ChainId } from '@biconomy/core-types'
import { SendUserOpResponse, getUserOpGasPricesResponse } from "./types/Bundler.types"
import { resolveProperties } from 'ethers/lib/utils'
import { deepHexlify } from '@biconomy/common'
import { HttpMethod, sendRequest } from './utils/httpRequests'

export class Bundler implements IBundler {

    constructor(readonly bundlerUrl: string,
        readonly entryPointAddress: string,
        readonly chainId: ChainId,
        readonly dappAPIKey: string) {
    }

    /**
     * 
     * @param chainId 
     * @description This function will fetch gasPrices from bundler
     * @returns 
     */
    async getUserOpGasPrices(chainId: ChainId): Promise<getUserOpGasPricesResponse> {
        const response: any = await sendRequest({
            url: `${this.bundlerUrl}`,
            method: HttpMethod.Post,
            body: {
                method: 'eth_getUserOpGasPrices',
                params: [chainId],
                id: 1234,
                jsonrpc: '2.0'
            }
        })
        return response
    }
    /**
     * 
     * @param userOp 
     * @description This function will send userOp to bundler
     * @returns 
     */
    async sendUserOp(userOp: UserOperation): Promise<SendUserOpResponse> {
        const hexifiedUserOp = deepHexlify(await resolveProperties(userOp))
        let params

        if (this.dappAPIKey && this.dappAPIKey !== '') {
            const metaData = {
                dappAPIKey: this.dappAPIKey
            }
            params = [hexifiedUserOp, this.entryPointAddress, this.chainId, metaData]
        } else {
            params = [hexifiedUserOp, this.entryPointAddress, this.chainId]
        }

        const response: SendUserOpResponse = await sendRequest({
            url: `${this.bundlerUrl}`,
            method: HttpMethod.Post,
            body: {
                method: 'eth_sendUserOperation',
                params: params,
                id: 1234,
                jsonrpc: '2.0'
            }
        })
        return response
    }
}