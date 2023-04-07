import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { resolveProperties } from 'ethers/lib/utils'

import { UserOperation } from '@biconomy-devx/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import Debug from 'debug'
import { Logger, deepHexlify } from '@biconomy-devx/common'

const debug = Debug('aa.rpc')
export class HttpRpcClient {
  private readonly userOpJsonRpcProvider: JsonRpcProvider

  // initializing: Promise<void>

  constructor(
    readonly bundlerUrl: string,
    readonly entryPointAddress: string,
    readonly chainId: number,
    readonly dappAPIKey: string // added by Biconomy
  ) {
    this.userOpJsonRpcProvider = new ethers.providers.JsonRpcProvider(this.bundlerUrl, {
      name: 'Not actually connected to network, only talking to the Bundler!',
      chainId
    })
    // this.initializing = this.validateChainId()
  }

  // review : bundler needs to support this
  async validateChainId(): Promise<void> {
    // validate chainId is in sync with expected chainid
    const chain = await this.userOpJsonRpcProvider.send('eth_chainId', [])
    const bundlerChain = parseInt(chain)
    if (bundlerChain !== this.chainId) {
      throw new Error(
        `bundler ${this.bundlerUrl} is on chainId ${bundlerChain}, but provider is on chainId ${this.chainId}`
      )
    }
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async sendUserOpToBundler(userOp1: UserOperation): Promise<any> {
    // await this.initializing
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp1))

    // const jsonRequestData: [UserOperation, string] = [hexifiedUserOp, this.entryPointAddress]
    // await this.printUserOperation('eth_sendUserOperation', jsonRequestData)

    let params

    if (this.dappAPIKey && this.dappAPIKey !== '') {
      const metaData = {
        dappAPIKey: this.dappAPIKey
      }
      params = [hexifiedUserOp, this.entryPointAddress, this.chainId, metaData]
    } else {
      params = [hexifiedUserOp, this.entryPointAddress, this.chainId]
    }

    const response: any = await sendRequest({
      url: `${this.bundlerUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'eth_sendUserOperation',
        params: params,
        id: 1234,
        jsonrpc: '2.0'
      }
    })

    Logger.log('rest relayer : response', response)
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

  async estimateUserOpGas(userOp1: Partial<UserOperation>): Promise<string> {
    // await this.initializing
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp1))
    // const jsonRequestData: [UserOperation, string] = [hexifiedUserOp, this.entryPointAddress]
    // await this.printUserOperation('eth_estimateUserOperationGas', jsonRequestData)
    return await this.userOpJsonRpcProvider.send('eth_estimateUserOperationGas', [
      hexifiedUserOp,
      this.entryPointAddress
    ])
  }

  private async printUserOperation(
    method: string,
    [userOp1, entryPointAddress]: [UserOperation, string]
  ): Promise<void> {
    const userOp = await resolveProperties(userOp1)
    debug(
      'sending',
      method,
      {
        ...userOp
        // initCode: (userOp.initCode ?? '').length,
        // callData: (userOp.callData ?? '').length
      },
      entryPointAddress
    )
  }
}
