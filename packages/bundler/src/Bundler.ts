import { IBundler } from "./interfaces/IBundler";
import { UserOperation, ChainId } from '@biconomy/core-types'
import { GetUserOperationResponse, GetUserOpByHashResponse, Bundlerconfig, UserOpResponse, EstimateUserOpGasResponse, UserOpReceipt, SendUserOpResponse, UserOpGasResponse, UserOpByHashResponse } from "./types/Types"
import { resolveProperties } from 'ethers/lib/utils'
import { deepHexlify, getTimestampInSeconds } from '@biconomy/common'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { transformUserOP } from './utils/HelperFunction'
import { UserOpReceiptIntervals } from './utils/Constants'
/**
 * This class implements IBundler interface. 
 * Implementation sends UserOperation to a bundler URL as per ERC4337 standard. 
 * Checkout the proposal for more details on Bundlers.
 */
export class Bundler implements IBundler {
    UserOpReceiptIntervals: { [key in ChainId]?: number }
    constructor(readonly bundlerConfig: Bundlerconfig) {
        this.UserOpReceiptIntervals = { ...UserOpReceiptIntervals, ...bundlerConfig.userOpReceiptIntervals }
    }

    private getBundlerUrl(chainId: ChainId): string {
        return `${this.bundlerConfig.bundlerUrl}/${chainId}/${this.bundlerConfig.apiKey}`
    }

    /**
     * 
     * @param chainId 
     * @description This function will fetch gasPrices from bundler
     * @returns Promise<UserOpGasPricesResponse>
     */
    async estimateUserOpGas(userOp: UserOperation, chainId: ChainId): Promise<UserOpGasResponse> {
        // TODO: will be removed once full userOp requirement is removed from bundler side
        const dummpyUserop = {
            callGasLimit: '0',
            verificationGasLimit: '0',
            preVerificationGas: '0',
            maxFeePerGas: '0',
            maxPriorityFeePerGas: '0',
            paymasterAndData: '0x',
            signature: '0x'
        }
        const userOperation = { ...dummpyUserop, ...userOp }
        userOp = transformUserOP(userOperation)
        console.log('userOp sending for fee estimate ', userOp);

        const bundlerUrl = this.getBundlerUrl(chainId)

        const response: EstimateUserOpGasResponse = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: 'eth_estimateUserOperationGas',
                params: [userOp, this.bundlerConfig.entryPointAddress],
                id: getTimestampInSeconds(),
                jsonrpc: '2.0'
            }
        })

        const userOpGasResponse = response.result
        for (const key in userOpGasResponse) {
            if (key === 'maxFeePerGas' || key === 'maxPriorityFeePerGas')
                continue
            if (!userOpGasResponse[key as keyof UserOpGasResponse]) {
                throw new Error(`Got undefined ${key} from bundler`);
            }
        }
        return userOpGasResponse
    }
    /**
     * 
     * @param userOp 
     * @description This function will send signed userOp to bundler to get mined on chain
     * @returns Promise<UserOpResponse>
     */
    async sendUserOp(userOp: UserOperation, chainId: ChainId): Promise<UserOpResponse> {
        // transformUserOP will convert all bigNumber values to string
        userOp = transformUserOP(userOp)
        const hexifiedUserOp = deepHexlify(await resolveProperties(userOp))
        let params = [hexifiedUserOp, this.bundlerConfig.entryPointAddress]
        const bundlerUrl = this.getBundlerUrl(chainId)
        const sendUserOperationResponse: SendUserOpResponse = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: 'eth_sendUserOperation',
                params: params,
                id: getTimestampInSeconds(),
                jsonrpc: '2.0'
            }
        })
        let response: UserOpResponse = {
            userOpHash: sendUserOperationResponse.result,
            wait: (confirmations?: number): Promise<UserOpReceipt> => {
                return new Promise<UserOpReceipt>(async (resolve, reject) => {
                    const intervalId = setInterval(async () => {
                        try {
                            const userOpResponse = await this.getUserOpReceipt(sendUserOperationResponse.result, chainId)
                            if (userOpResponse && userOpResponse.receipt && userOpResponse.receipt.confirmations >= (confirmations || 0)) {
                                clearInterval(intervalId);
                                resolve(userOpResponse);
                            }
                        } catch (error) {
                            clearInterval(intervalId);
                            reject(error);
                        }
                    }, this.UserOpReceiptIntervals[chainId]);
                });
            }
        }
        return response
    }


    /**
     * 
     * @param userOpHash
     * @description This function will return userOpReceipt for a given userOpHash
     * @returns Promise<UserOpReceipt>
     */
    async getUserOpReceipt(userOpHash: string, chainId: ChainId): Promise<UserOpReceipt> {
        const bundlerUrl = this.getBundlerUrl(chainId)
        const response: GetUserOperationResponse = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: 'eth_getUserOperationReceipt',
                params: [userOpHash],
                id: getTimestampInSeconds(),
                jsonrpc: '2.0'
            }
        })
        const userOpReceipt: UserOpReceipt = response.result
        return userOpReceipt
    }
    /**
     * 
     * @param userOpHash 
     * @param chainId
     * @description this function will return UserOpByHashResponse for given UserOpHash
     * @returns Promise<UserOpByHashResponse> 
     */
    async getUserOpByHash(userOpHash: string, chainId: ChainId): Promise<UserOpByHashResponse> {
        const bundlerUrl = this.getBundlerUrl(chainId)
        const response: GetUserOpByHashResponse = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: 'eth_getUserOperationByHash',
                params: [userOpHash],
                id: getTimestampInSeconds(),
                jsonrpc: '2.0'
            }
        })
        const userOpByHashResponse: UserOpByHashResponse = response.result
        return userOpByHashResponse
    }
}