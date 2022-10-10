import { UserOperationStruct } from '@account-abstraction/contracts'
import { resolveProperties } from '@ethersproject/properties'
import axios from 'axios' // httpSendRequest or through NodeClient

export class PaymasterAPI {

  // Might maintain API key at smart account level
  constructor(readonly apiUrl: string, readonly dappAPIKey: string) {
    axios.defaults.baseURL = apiUrl
  }

  async getPaymasterAndData (userOp: Partial<UserOperationStruct>): Promise<string> {
    console.log(userOp)
    userOp = await resolveProperties(userOp)
    // this.nodeClient.paymasterVerify()
    // Note: Might be different service that bypass SDK backend node
    const result = await axios.post('/signing-service', {
      userOp
    })
    console.log('******** ||||| *********')
    console.log('signing service response', result)

    return result.data.paymasterAndData
  }
}
