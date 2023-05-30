import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { IPaymasterAPI, PaymasterConfig, PaymasterServiceDataType } from '@biconomy/core-types'
import { Logger } from '@biconomy/common'
import { PaymasterAPI } from './PaymasterAPI'

/**
 * ERC20 Token Paymaster API supported via Biconomy dahsboard to enable Gas payments in ERC20 tokens
 */
export class BiconomyTokenPaymasterAPI extends PaymasterAPI {
  constructor(readonly paymasterConfig: PaymasterConfig) {
    super()
  }

  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: PaymasterServiceDataType
  ): Promise<string> {
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
        url: `${this.paymasterConfig.paymasterUrl}/user-op`,
        method: HttpMethod.Post,
        body: { userOp: userOp, paymasterServiceData: paymasterServiceData }
      })

      // TODO: update with below way shared by PM service team
      /*const result: any = await sendRequest({
        url: 'http://localhost:3002/api/v1/80001/LrbQUUcJj.a75cff34-2cf9-4038-80ac-fa1ad21acd90',
        method: HttpMethod.Post,
        body: {
          method: 'pm_sponsorUserOperation',
          params: [userOp], // paymasterServiceData: paymasterServiceData
          id: 1234,
          jsonrpc: '2.0'
        }
      })*/

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
