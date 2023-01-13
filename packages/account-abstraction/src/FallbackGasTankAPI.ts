import { resolveProperties } from '@ethersproject/properties'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { IFallbackAPI, FallbackUserOperation } from '@biconomy/core-types'

/**
 * Verifying Dapp Identifier API supported via Biconomy dahsboard to enable fallback Gasless transactions
 */
export class FallbackGasTankAPI implements IFallbackAPI {
  constructor(readonly signingServiceUrl: string, readonly dappAPIKey: string) {
    this.signingServiceUrl = signingServiceUrl
    this.dappAPIKey = dappAPIKey
  }

  async getDappIdentifierAndSign(fallbackUserOp: Partial<FallbackUserOperation>): Promise<string> {
    try {
      if (!this.dappAPIKey || this.dappAPIKey === '') {
        return '0x'
      }

      fallbackUserOp = await resolveProperties(fallbackUserOp)
      fallbackUserOp.sender = fallbackUserOp.sender
      fallbackUserOp.nonce = Number(fallbackUserOp.nonce)
      fallbackUserOp.callData = fallbackUserOp.callData
      fallbackUserOp.callGasLimit = fallbackUserOp.callGasLimit
      fallbackUserOp.dappIdentifier = ''
      fallbackUserOp.signature = '0x'

      // move dappAPIKey in headers
      const result: any = await sendRequest({
        url: `${this.signingServiceUrl}`,
        method: HttpMethod.Post,
        headers: { 'x-api-key': this.dappAPIKey },
        body: { fallbackUserOp: fallbackUserOp, smartAccountVersion: '1.0.1' }
      })

      console.log('******** ||||| *********')
      console.log('verifying and signing service response', result)

      if (result && result.data && result.code === 200) {
        return result.data.paymasterAndData
      } else {
        console.log('error in verifying. sending paymasterAndData 0x')
        console.log(result.error)
      }
    } catch (err) {
      console.log('error in signing service response')
      console.error(err)
      return '0x'
    }
    return '0x'
  }
}
