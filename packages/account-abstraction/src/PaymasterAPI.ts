import { resolveProperties } from '@ethersproject/properties'
import axios from 'axios' // httpSendRequest or through NodeClient
import { UserOperation } from '@biconomy-sdk/core-types'
export class PaymasterAPI {

  // Might maintain API key at smart account level
  constructor(readonly apiUrl: string, readonly dappAPIKey: string) {
    axios.defaults.baseURL = apiUrl
  }

  async getPaymasterAndData (userOp: Partial<UserOperation>): Promise<string> {
    console.log(userOp)
    userOp = await resolveProperties(userOp)
    // this.nodeClient.paymasterVerify()
    // Note: Might be different service that bypass SDK backend node
    userOp.nonce = Number(userOp.nonce)
    userOp.callGasLimit = Number(userOp.callGasLimit)
    userOp.verificationGasLimit = Number(userOp.verificationGasLimit)
    userOp.maxFeePerGas = Number(userOp.maxFeePerGas)
    userOp.maxPriorityFeePerGas = Number(userOp.maxPriorityFeePerGas)
    userOp.preVerificationGas = 21000;
    userOp.signature = '0x'
    userOp.paymasterAndData = '0x'

    const result = await axios.post('/signing-service', {
      userOp
    })
    console.log('******** ||||| *********')
    console.log('signing service response', result)

    return result.data.paymasterAndData
    // return '0x'
  }
}
