import { IBundler } from "./interfaces/IBundler";
import { UserOperation, ChainId } from '@biconomy/core-types'
import { Bundlerconfig, UserOpResponse, UserOpGasFieldsResponse } from "./types/Types"
import { resolveProperties } from 'ethers/lib/utils'
import { deepHexlify, getTimestampInSeconds } from '@biconomy/common'
import { HttpMethod, sendRequest } from './utils/httpRequests'

/**
 * This class implements IBundler interface. 
 * Implementation sends UserOperation to a bundler URL as per ERC4337 standard. 
 * Checkout the proposal for more details on Bundlers.
 */
export class Bundler implements IBundler {

    constructor(readonly bundlerConfig: Bundlerconfig) {}

    /**
     * 
     * @param chainId 
     * @description This function will fetch gasPrices from bundler
     * @returns Promise<UserOpGasPricesResponse>
     */
    async getUserOpGasFields(userOp: Partial<UserOperation>, chainId: ChainId): Promise<UserOpGasFieldsResponse> {
        const response: any = await sendRequest({
            url: `${this.bundlerConfig.bundlerUrl}`,
            method: HttpMethod.Post,
            body: {
                method: 'eth_getUserOpGasFields',
                params: [userOp, this.bundlerConfig.entryPointAddress, chainId],
                id: getTimestampInSeconds(),
                jsonrpc: '2.0'
            }
        })
        return response
    }
    /**
     * 
     * @param userOp 
     * @description This function will send signed userOp to bundler to get mined on chain
     * @returns Promise<UserOpResponse>
     */
    async sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<UserOpResponse> {
        const hexifiedUserOp = deepHexlify(await resolveProperties(userOp))
        let params = [hexifiedUserOp, this.bundlerConfig.entryPointAddress, chainId]

        const response: UserOpResponse = await sendRequest({
            url: `${this.bundlerConfig.bundlerUrl}`,
            method: HttpMethod.Post,
            body: {
                method: 'eth_sendUserOperation',
                params: params,
                id: getTimestampInSeconds(),
                jsonrpc: '2.0'
            }
        })
        return response
    }
}