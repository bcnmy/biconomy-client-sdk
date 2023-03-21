import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { IPaymasterAPI } from '@biconomy/core-types'
import { Logger } from '@biconomy/common'

/**
 * Verifying Paymaster API supported via Biconomy dahsboard to enable Gasless transactions
 */
export class BiconomyPaymasterAPI implements IPaymasterAPI {
  constructor(readonly signingServiceUrl: string, readonly dappAPIKey: string) {
    this.signingServiceUrl = signingServiceUrl
    this.dappAPIKey = dappAPIKey
  }

  async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
    try {
      if (!this.dappAPIKey || this.dappAPIKey === '') {
        return '0x'
      }

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
      const result: any = await sendRequest({
        url: `${this.signingServiceUrl}/user-op`,
        method: HttpMethod.Post,
        headers: { 'x-api-key': this.dappAPIKey },
        body: { userOp: userOp }
      })

      Logger.log('verifying and signing service response', result)

      if (result && result.data && result.statusCode === 200) {
        return result.data.paymasterAndData
      } else {
        console.error(result.error)
        throw new Error('Error in verifying. sending paymasterAndData 0x')
      }
    } catch (err) {
      console.error(err)
      throw new Error('Error in verifying. sending paymasterAndData 0x')
    }
  }
}
