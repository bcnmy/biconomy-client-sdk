import { Logger, sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy/core-types'
import { PaymasterAPI } from './Paymaster'
import { VerifyingPaymasterData } from './types/Types'
import { PaymasterAndDataResponse, PaymasterConfig } from './types/Types'
import { BigNumber } from 'ethers'

/**
 * Verifying Paymaster API supported via Biconomy dahsboard to enable Gasless transactions
 */
export class BiconomyVerifyingPaymaster extends PaymasterAPI<VerifyingPaymasterData> {
  constructor(readonly paymasterConfig: PaymasterConfig) {
    super()
  }

  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: VerifyingPaymasterData
  ): Promise<string> {
    try {
      userOp = await resolveProperties(userOp)
      userOp.nonce = BigNumber.from(userOp.nonce).toHexString()
      userOp.callGasLimit = BigNumber.from(userOp.callGasLimit).toHexString()
      userOp.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toHexString()
      userOp.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString()
      userOp.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString()
      userOp.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toHexString()
      userOp.signature = '0x'
      userOp.paymasterAndData = '0x'

      Logger.log('userop from Verifying Paymaster ', userOp)

      Logger.log('paymasterServiceData ', paymasterServiceData)

      // TODO: define type and review error handling
      // const result: PaymasterAndDataResponse
      const response: any = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_sponsorUserOperation',
          params: [userOp, paymasterServiceData],
          id: 1234,
          jsonrpc: '2.0'
        }
      })

      Logger.log('verifying and signing service response', response)

      if (response && response.result) {
        return response.result.paymasterAndData
      } else {
        if (!this.paymasterConfig.strictSponsorshipMode) {
          return '0x'
        }
        // Logger.log(result)
        // TODO: Review: If we will get a different code and result.message
        if (response.error) {
          Logger.log(response.error.toString())
          throw new Error(
            'Error in verifying gas sponsorship. Reason: '.concat(response.error.toString())
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
