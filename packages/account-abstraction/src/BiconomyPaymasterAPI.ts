import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy-sdk/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { IPaymasterAPI } from '@biconomy-sdk/core-types'

/**
 * Verifying Paymaster API supported via Biconomy dahsboard to enable Gasless transactions
 */
export class BiconomyPaymasterAPI implements IPaymasterAPI {
  constructor(readonly signingServiceUrl: string, readonly dappAPIKey: string) {
    this.signingServiceUrl = signingServiceUrl
  }

  async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
    userOp = await resolveProperties(userOp)
    userOp.nonce = Number(userOp.nonce)
    userOp.callGasLimit = Number(userOp.callGasLimit)
    userOp.verificationGasLimit = Number(userOp.verificationGasLimit)
    userOp.maxFeePerGas = Number(userOp.maxFeePerGas)
    userOp.maxPriorityFeePerGas = Number(userOp.maxPriorityFeePerGas)
    userOp.preVerificationGas = 21000
    userOp.signature = '0x'
    userOp.paymasterAndData = '0x'

    // move dappAPIKey in headers
    const result: any = await sendRequest({
      url: `${this.signingServiceUrl}`,
      method: HttpMethod.Post,
      body: { userOp: userOp, dappAPIKey: this.dappAPIKey }
    })

    console.log('******** ||||| *********')
    console.log('signing service response', result)

    // ToDo: Get paymaster addr from dapp id / smart account config
    if (result) {
      return result
    }

    return '0x'
  }
}
