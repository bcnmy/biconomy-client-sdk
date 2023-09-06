import { IBundler } from './interfaces/IBundler'
import { UserOperation, ChainId } from '@biconomy-devx/core-types'
import {
  GetUserOperationResponse,
  GetUserOpByHashResponse,
  Bundlerconfig,
  UserOpResponse,
  EstimateUserOpGasResponse,
  UserOpReceipt,
  SendUserOpResponse,
  UserOpGasResponse,
  UserOpByHashResponse
} from './utils/Types'
import { resolveProperties } from 'ethers/lib/utils'
import {
  deepHexlify,
  sendRequest,
  getTimestampInSeconds,
  HttpMethod,
  Logger,
  RPC_PROVIDER_URLS
} from '@biconomy-devx/common'
import { transformUserOP } from './utils/HelperFunction'
import { UserOpReceiptIntervals } from './utils/Constants'
import { JsonRpcProvider } from '@ethersproject/providers'

/**
 * This class implements IBundler interface.
 * Implementation sends UserOperation to a bundler URL as per ERC4337 standard.
 * Checkout the proposal for more details on Bundlers.
 */
export class Bundler implements IBundler {
  UserOpReceiptIntervals: { [key in ChainId]?: number }
  constructor(readonly bundlerConfig: Bundlerconfig) {
    this.UserOpReceiptIntervals = {
      ...UserOpReceiptIntervals,
      ...bundlerConfig.userOpReceiptIntervals
    }
  }

  private getBundlerUrl(): string {
    return `${this.bundlerConfig.bundlerUrl}`
  }

  /**
   *
   * @param chainId
   * @description This function will fetch gasPrices from bundler
   * @returns Promise<UserOpGasPricesResponse>
   */
  async estimateUserOpGas(userOp: UserOperation): Promise<UserOpGasResponse> {
    // expected dummySig and possibly dummmy paymasterAndData should be provided by the caller
    // bundler doesn't know account and paymaster implementation
    userOp = transformUserOP(userOp)
    Logger.log('userOp sending for fee estimate ', userOp)

    const bundlerUrl = this.getBundlerUrl()

    const response: EstimateUserOpGasResponse = await sendRequest({
      url: bundlerUrl,
      method: HttpMethod.Post,
      body: {
        method: 'eth_estimateUserOperationGas',
        params: [userOp, this.bundlerConfig.entryPointAddress],
        id: getTimestampInSeconds(),
        jsonrpc: '2.0'
      }
    })

    const userOpGasResponse = response.result
    for (const key in userOpGasResponse) {
      if (key === 'maxFeePerGas' || key === 'maxPriorityFeePerGas') continue
      if (!userOpGasResponse[key as keyof UserOpGasResponse]) {
        throw new Error(`Got undefined ${key} from bundler`)
      }
    }
    return userOpGasResponse
  }
  /**
   *
   * @param userOp
   * @description This function will send signed userOp to bundler to get mined on chain
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: UserOperation): Promise<UserOpResponse> {
    const chainId = this.bundlerConfig.chainId
    // transformUserOP will convert all bigNumber values to string
    userOp = transformUserOP(userOp)
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp))
    const params = [hexifiedUserOp, this.bundlerConfig.entryPointAddress]
    const bundlerUrl = this.getBundlerUrl()
    const sendUserOperationResponse: SendUserOpResponse = await sendRequest({
      url: bundlerUrl,
      method: HttpMethod.Post,
      body: {
        method: 'eth_sendUserOperation',
        params: params,
        id: getTimestampInSeconds(),
        jsonrpc: '2.0'
      }
    })
    const response: UserOpResponse = {
      userOpHash: sendUserOperationResponse.result,
      wait: (confirmations?: number): Promise<UserOpReceipt> => {
        const provider = new JsonRpcProvider(RPC_PROVIDER_URLS[chainId])
        return new Promise<UserOpReceipt>(async (resolve, reject) => {
          const intervalId = setInterval(async () => {
            try {
              const userOpResponse = await this.getUserOpReceipt(sendUserOperationResponse.result)
              if (userOpResponse && userOpResponse.receipt && userOpResponse.receipt.blockNumber) {
                if (confirmations) {
                  const latestBlock = await provider.getBlockNumber()
                  const confirmedBlocks = latestBlock - userOpResponse.receipt.blockNumber
                  if (confirmations >= confirmedBlocks) {
                    clearInterval(intervalId)
                    resolve(userOpResponse)
                  }
                }
                clearInterval(intervalId)
                resolve(userOpResponse)
              }
            } catch (error) {
              clearInterval(intervalId)
              reject(error)
            }
          }, this.UserOpReceiptIntervals[chainId])
        })
      }
    }
    return response
  }

  /**
   *
   * @param userOpHash
   * @description This function will return userOpReceipt for a given userOpHash
   * @returns Promise<UserOpReceipt>
   */
  async getUserOpReceipt(userOpHash: string): Promise<UserOpReceipt> {
    const bundlerUrl = this.getBundlerUrl()
    const response: GetUserOperationResponse = await sendRequest({
      url: bundlerUrl,
      method: HttpMethod.Post,
      body: {
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
        id: getTimestampInSeconds(),
        jsonrpc: '2.0'
      }
    })
    const userOpReceipt: UserOpReceipt = response.result
    return userOpReceipt
  }
  /**
   *
   * @param userOpHash
   * @param chainId
   * @description this function will return UserOpByHashResponse for given UserOpHash
   * @returns Promise<UserOpByHashResponse>
   */
  async getUserOpByHash(userOpHash: string): Promise<UserOpByHashResponse> {
    const bundlerUrl = this.getBundlerUrl()
    const response: GetUserOpByHashResponse = await sendRequest({
      url: bundlerUrl,
      method: HttpMethod.Post,
      body: {
        method: 'eth_getUserOperationByHash',
        params: [userOpHash],
        id: getTimestampInSeconds(),
        jsonrpc: '2.0'
      }
    })
    const userOpByHashResponse: UserOpByHashResponse = response.result
    return userOpByHashResponse
  }
}
