import { IBundler } from "./interfaces/IBundler.interface";
import { UserOperation, ChainId } from '@biconomy/core-types'
import { SendUserOpResponse, getUserOpGasPricesResponse } from "./types/Bundler.types"
import { resolveProperties } from 'ethers/lib/utils'
import { deepHexlify } from '@biconomy/common'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { BigNumber } from 'ethers'
export class Bundler implements IBundler {

    constructor(readonly bundlerUrl: string,
        readonly entryPointAddress: string) {
    }

    /**
     * 
     * @param chainId 
     * @description This function will fetch gasPrices from bundler
     * @returns 
     */
    async getUserOpGasPrices(userOp: Partial<UserOperation>, chainId: ChainId): Promise<getUserOpGasPricesResponse> {

        const { nonce, callData, initCode, sender, paymasterAndData } = userOp
        const partialUserOp = {
            nonce: nonce ? BigNumber.from(nonce).toHexString() : nonce, callData, initCode, sender, paymasterAndData
        }
        console.log('sending userOp to bundler', partialUserOp);

        const response: any = await sendRequest({
            url: `${this.bundlerUrl}`,
            method: HttpMethod.Post,
            body: {
                method: 'eth_getUserOpGasFields',
                params: [partialUserOp, this.entryPointAddress, chainId],
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
    async sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<SendUserOpResponse> {
        const hexifiedUserOp = deepHexlify(await resolveProperties(userOp))
        let params = [hexifiedUserOp, this.entryPointAddress, chainId]
        console.log('sending userOp to bundler ', params)
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
        console.log('bundler response', response);
        return response
    }
}