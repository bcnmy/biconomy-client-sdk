import { sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy/core-types'
import { IPaymasterAPI } from 'interfaces/IPaymaster'
import { PaymasterAndDataResponse } from './types/Types'

export class BiconomyPaymasterAPI implements IPaymasterAPI {
    constructor(readonly paymasterServiceUrl: string, readonly strictSponsorshipMode?: boolean) { }
  /**
   *
   * @param userOp
   * @description This function will send userOp to paymaster service to get signed from paymaster signer
   * @returns string
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

      const result: PaymasterAndDataResponse = await sendRequest({
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
    } catch (error) {
      console.log('error while getting paymaster response', error)
      if (this.strictSponsorshipMode) {
        throw error
      }
    }
    return '0x'
  }
}
