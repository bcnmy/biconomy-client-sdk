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
    const result = await axios.post('/signPaymaster', {
      dappAPIKey: this.dappAPIKey,
      userOp,
    })

    return result.data.paymasterAndData
    // Fallback : return '0x'
  }
}
