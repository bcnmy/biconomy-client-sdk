import { resolveProperties } from '@ethersproject/properties'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { IFallbackAPI, FallbackUserOperation, FallbackApiResponse } from '@biconomy-devx/core-types'
import { Logger } from '@biconomy-devx/common'

/**
 * Verifying and Signing fallback gasless transactions
 */
export class FallbackGasTankAPI implements IFallbackAPI {
  constructor(readonly signingServiceUrl: string, readonly dappAPIKey: string) {
    this.signingServiceUrl = signingServiceUrl
    this.dappAPIKey = dappAPIKey
  }

  async getDappIdentifierAndSign(
    fallbackUserOp: Partial<FallbackUserOperation>
  ): Promise<FallbackApiResponse> {
    try {
      if (!this.dappAPIKey || this.dappAPIKey === '') {
        throw new Error('Dapp API Key not found. Please pass dappAPIKey in constructor')
      }

      fallbackUserOp = await resolveProperties(fallbackUserOp)
      fallbackUserOp.sender = fallbackUserOp.sender
      fallbackUserOp.target = fallbackUserOp.target
      fallbackUserOp.nonce = Number(fallbackUserOp.nonce)
      fallbackUserOp.callData = fallbackUserOp.callData
      fallbackUserOp.callGasLimit = fallbackUserOp.callGasLimit
      fallbackUserOp.dappIdentifier = ''
      fallbackUserOp.signature = '0x'

      // move dappAPIKey in headers
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const result: any = await sendRequest({
        url: `${this.signingServiceUrl}/fallback-user-op`,
        method: HttpMethod.Post,
        headers: { 'x-api-key': this.dappAPIKey },
        body: { fallbackUserOp: fallbackUserOp }
      })

      if (result && result.data && result.statusCode === 200) {
        return result.data
      } else {
        console.error(result.error)
        throw new Error('Error in fallback signing api')
      }
    } catch (err) {
      Logger.error('Error in fallback signing api', err)
      throw new Error('Error in fallback signing api')
    }
  }
}
