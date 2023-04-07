import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy-devx/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { IPaymasterAPI, PaymasterConfig } from '@biconomy-devx/core-types'
import { Logger } from '@biconomy-devx/common'

/**
 * Verifying Paymaster API supported via Biconomy dahsboard to enable Gasless transactions
 */
// TODO: possibly rename to BiconomyVerifyingPaymasterAPI
export class BiconomyPaymasterAPI implements IPaymasterAPI {
  paymasterConfig: PaymasterConfig

  constructor(paymasterConfig: PaymasterConfig) {
    this.paymasterConfig = paymasterConfig
  }

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

      // move dappAPIKey in headers
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const result: any = await sendRequest({
        url: `${this.paymasterConfig.signingServiceUrl}/user-op`,
        method: HttpMethod.Post,
        headers: { 'x-api-key': this.paymasterConfig.dappAPIKey },
        body: { userOp: userOp }
      })

      Logger.log('verifying and signing service response', result)

      if (result && result.data && result.statusCode === 200) {
        return result.data.paymasterAndData
      } else {
        if (!this.paymasterConfig.strictSponsorshipMode) {
          return '0x'
        }
        // Logger.log(result)
        // Review: If we will get a different code and result.message
        if (result.error) {
          Logger.log(result.error.toString())
          throw new Error(
            'Error in verifying gas sponsorship. Reason: '.concat(result.error.toString())
          )
        }
        throw new Error('Error in verifying gas sponsorship. Reason unknown')
      }
    } catch (err: any) {
      if (!this.paymasterConfig.strictSponsorshipMode) {
        Logger.log('sending paymasterAndData 0x')
        Logger.log('Reason ', err.toString())
        return '0x'
      }
      Logger.error('Error in verifying gas sponsorship.', err.toString())
      throw new Error('Error in verifying gas sponsorship. Reason: '.concat(err.toString()))
    }
  }
}
