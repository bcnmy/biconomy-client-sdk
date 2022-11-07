import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { hexValue, resolveProperties } from 'ethers/lib/utils'

import { UserOperation } from '@biconomy-sdk/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
export class HttpRpcClient {
  private readonly userOpJsonRpcProvider: JsonRpcProvider

  constructor(
    readonly bundlerUrl: string,
    readonly entryPointAddress: string,
    readonly chainId: number,
    readonly dappAPIKey: string,
  ) {
    this.userOpJsonRpcProvider = new ethers.providers.JsonRpcProvider(this.bundlerUrl, {
      name: 'Not actually connected to network, only talking to the Bundler!',
      chainId
    })
  }

  // TODO : add version of HttpRpcClient || interface in RPC relayer to sendSCWTransactionToRelayer

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async sendUserOpToBundler(userOp1: UserOperation): Promise<any> {
    // TODO comes from own config
    const userOp = await resolveProperties(userOp1)
    const hexifiedUserOp: any = Object.keys(userOp)
      .map((key) => {
        let val = (userOp as any)[key]
        if (typeof val !== 'string' || !val.startsWith('0x')) {
          val = hexValue(val)
        }
        return [key, val]
      })
      .reduce((set, [k, v]) => ({ ...set, [k]: v }), {})

    const jsonRequestData: [UserOperation, string] = [hexifiedUserOp, this.entryPointAddress]
    await this.printUserOperation(jsonRequestData)
    /*return await this.userOpJsonRpcProvider.send('eth_sendUserOperation', [
      hexifiedUserOp,
      this.entryPointAddress,
      this.chainId
    ])*/

    const metaData = {
      dappAPIKey: this.dappAPIKey
    }

    const response: any = await sendRequest({
      url: `${this.bundlerUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'eth_sendUserOperation',
        params: [hexifiedUserOp, this.entryPointAddress, this.chainId, metaData],
        id: 1234,
        jsonrpc: '2.0'
      }
    })

    console.log('rest relayer : response')
    console.log(response)
    if (response && response.data) {
      const transactionId = response.data.transactionId
      const connectionUrl = response.data.connectionUrl

      return {
        connectionUrl: connectionUrl,
        transactionId: transactionId
      }
    } else {
      return {
        error: response.error || 'transaction failed'
      }
    }
  }

  private async printUserOperation([userOp1, entryPointAddress]: [
    UserOperation,
    string
  ]): Promise<void> {
    const userOp = await resolveProperties(userOp1)
    console.log(
      'sending eth_sendUserOperation',
      {
        ...userOp,
        initCode: (userOp.initCode ?? '').length,
        callData: (userOp.callData ?? '').length
      },
      entryPointAddress
    )
  }
}
