import { sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy/core-types'
import { IPaymasterAPI } from 'interfaces/IPaymaster.interface'
import { getPaymasterAndDataResponse } from './types/paymaster.types'

export class BiconomyPaymasterAPI implements IPaymasterAPI {
    constructor(readonly paymasterServiceUrl: string, readonly strictSponsorshipMode?: boolean) { }

    /**
     * 
     * @param userOp 
     * @description This function will send userOp to paymaster service to signed userOp from paymaster signer
     * @returns 
     */
    async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
        try {
            userOp = await resolveProperties(userOp)
            userOp.nonce = Number(userOp.nonce)
            userOp.callGasLimit = Number(userOp.callGasLimit)
            userOp.verificationGasLimit = Number(userOp.verificationGasLimit)
            userOp.maxFeePerGas = Number(userOp.maxFeePerGas)
            userOp.maxPriorityFeePerGas = Number(userOp.maxPriorityFeePerGas)
            userOp.preVerificationGas = Number(userOp.preVerificationGas)
            userOp.signature = '0x'
            userOp.paymasterAndData = '0x'

            console.log('sending request to paymaster service');
            console.log(userOp);


            let result: getPaymasterAndDataResponse = await sendRequest({
                url: this.paymasterServiceUrl,
                method: HttpMethod.Post,
                headers: { 'x-api-key': '5YiBWXwz4.7e99c90f-7225-4d30-b69a-c9a34ddf7a26' },
                body: { userOp: userOp }
            })


            console.log('paymaster service response ', result);


            if (result && result.data && result.statusCode === 200) {
                return result.data.paymasterAndData
            } else {
                if (!this.strictSponsorshipMode) {
                    return '0x'
                }
            }

        } catch (error) {
            console.log('error while getting paymaster response');
        }
        return '0x'
    }
}