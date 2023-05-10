import { sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy/core-types'
import { IPaymasterAPI } from 'interfaces/IPaymaster.interface'
import { getPaymasterAndDataResponse } from './types/paymaster.types'

export class BiconomyPaymasterAPI implements IPaymasterAPI {
    constructor(readonly paymasterServiceUrl: string, readonly strictSponsorshipMode: boolean) {}

    /**
     * 
     * @param userOp 
     * @description This function will send userOp to paymaster service to signed userOp from paymaster signer
     * @returns 
     */
    async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
        userOp = await resolveProperties(userOp)
        userOp.nonce = Number(userOp.nonce)
        userOp.callGasLimit = Number(userOp.callGasLimit)
        userOp.verificationGasLimit = Number(userOp.verificationGasLimit)
        userOp.maxFeePerGas = Number(userOp.maxFeePerGas)
        userOp.maxPriorityFeePerGas = Number(userOp.maxPriorityFeePerGas)
        userOp.preVerificationGas = Number(userOp.preVerificationGas)
        userOp.signature = '0x'
        userOp.paymasterAndData = '0x'

        // move dappAPIKey in headers
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const result: getPaymasterAndDataResponse = await sendRequest({
            url: this.paymasterServiceUrl,
            method: HttpMethod.Post,
            body: { userOp: userOp }
        })

        if (result && result.data && result.statusCode === 200) {
            return result.data.paymasterAndData
        } else {
            if (!this.strictSponsorshipMode) {
                return '0x'
            }
        }
        return '0x'
    }
}