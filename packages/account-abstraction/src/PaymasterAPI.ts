import { resolveProperties } from '@ethersproject/properties'
import { UserOperation } from '@biconomy-sdk/core-types'
import { hexConcat } from 'ethers/lib/utils'
import { HttpMethod, sendRequest } from './utils/httpRequests'
export class PaymasterAPI {

  // Might maintain API key at smart account level
  constructor(readonly apiUrl: string, readonly dappAPIKey: string) {
    this.apiUrl = apiUrl
  }

  async getPaymasterAndData (userOp: Partial<UserOperation>): Promise<string> {
    console.log(userOp)
    userOp = await resolveProperties(userOp)
    console.log('userOp')
    console.log(userOp)
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

    const result: any = await  sendRequest({
      url: `${this.apiUrl}/signing-service`,
      method: HttpMethod.Post,
      body: { "userOp": userOp }
    })

    console.log('******** ||||| *********')
    console.log('signing service response', result)

    // ToDo: Get paymaster addr from dapp id / smart account config
    if(result) {
    return hexConcat(['0x50e8996670759E1FAA315eeaCcEfe0c0A043aA51', result.signedMessage])
    }

    return '0x'
  }
}
