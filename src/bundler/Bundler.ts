import { http, type Hash, type PublicClient, createPublicClient } from "viem"
import type { StateOverrideSet, UserOperationStruct } from "../account"
import type { SimulationType } from "../account"
import {
  HttpMethod,
  getChain,
  isNullOrUndefined,
  sendRequest
} from "../account"
import type { IBundler } from "./interfaces/IBundler.js"
import {
  DEFAULT_ENTRYPOINT_ADDRESS,
  UserOpReceiptIntervals,
  UserOpReceiptMaxDurationIntervals,
  UserOpWaitForTxHashIntervals,
  UserOpWaitForTxHashMaxDurationIntervals
} from "./utils/Constants.js"
import { getTimestampInSeconds } from "./utils/HelperFunction.js"
import type {
  BundlerConfigWithChainId,
  BundlerEstimateUserOpGasResponse,
  Bundlerconfig,
  GetUserOpByHashResponse,
  GetUserOperationGasPriceReturnType,
  GetUserOperationReceiptResponse,
  GetUserOperationStatusResponse,
  SendUserOpResponse,
  UserOpByHashResponse,
  UserOpGasResponse,
  UserOpReceipt,
  UserOpResponse,
  UserOpStatus
} from "./utils/Types.js"
import { deepHexlify, extractChainIdFromBundlerUrl } from "./utils/Utils.js"

/**
 * This class implements IBundler interface.
 * Implementation sends UserOperation to a bundler URL as per ERC4337 standard.
 * Checkout the proposal for more details on Bundlers.
 */
export class Bundler implements IBundler {
  private bundlerConfig: BundlerConfigWithChainId

  // eslint-disable-next-line no-unused-vars
  UserOpReceiptIntervals!: { [key in number]?: number }

  UserOpWaitForTxHashIntervals!: { [key in number]?: number }

  UserOpReceiptMaxDurationIntervals!: { [key in number]?: number }

  UserOpWaitForTxHashMaxDurationIntervals!: { [key in number]?: number }

  private provider: PublicClient

  constructor(bundlerConfig: Bundlerconfig) {
    const parsedChainId: number = bundlerConfig?.chainId ?? 11155111 // TODO: remove hardcoded chainId
    // || extractChainIdFromBundlerUrl(bundlerConfig.bundlerUrl)
    this.bundlerConfig = { ...bundlerConfig, chainId: parsedChainId }

    this.provider = createPublicClient({
      chain:
        bundlerConfig.viemChain ??
        bundlerConfig.customChain ??
        getChain(parsedChainId),
      transport: http(
        (
          bundlerConfig.viemChain ||
          bundlerConfig.customChain ||
          getChain(parsedChainId)
        ).rpcUrls.default.http[0]
      )
    })

    this.UserOpReceiptIntervals = {
      ...UserOpReceiptIntervals,
      ...bundlerConfig.userOpReceiptIntervals
    }

    this.UserOpWaitForTxHashIntervals = {
      ...UserOpWaitForTxHashIntervals,
      ...bundlerConfig.userOpWaitForTxHashIntervals
    }

    this.UserOpReceiptMaxDurationIntervals = {
      ...UserOpReceiptMaxDurationIntervals,
      ...bundlerConfig.userOpReceiptMaxDurationIntervals
    }

    this.UserOpWaitForTxHashMaxDurationIntervals = {
      ...UserOpWaitForTxHashMaxDurationIntervals,
      ...bundlerConfig.userOpWaitForTxHashMaxDurationIntervals
    }

    this.bundlerConfig.entryPointAddress =
      bundlerConfig.entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS
  }

  public getBundlerUrl(): string {
    return `${this.bundlerConfig.bundlerUrl}`
  }

  /**
   * @param userOpHash
   * @description This function will fetch gasPrices from bundler
   * @returns Promise<UserOpGasPricesResponse>
   */
  async estimateUserOpGas(
    _userOp: UserOperationStruct,
    stateOverrideSet?: StateOverrideSet
  ): Promise<UserOpGasResponse> {
    // expected dummySig and possibly dummmy paymasterAndData should be provided by the caller
    // bundler doesn't know account and paymaster implementation
    // const userOp = transformUserOP(_userOp)
    const bundlerUrl = this.getBundlerUrl()

    const response: {
      result: BundlerEstimateUserOpGasResponse
      error: { message: string }
    } = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_estimateUserOperationGas",
          params: [deepHexlify(_userOp), this.bundlerConfig.entryPointAddress],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0"
        }
      },
      "Bundler"
    )

    const userOpGasResponse = response
    for (const key in userOpGasResponse) {
      if (
        userOpGasResponse[key as keyof UserOpGasResponse] === undefined ||
        userOpGasResponse[key as keyof UserOpGasResponse] === null
      ) {
        throw new Error(`Got undefined ${key} from bundler`)
      }
    }

    if (isNullOrUndefined(response.result)) {
      throw new Error(
        `Error from Bundler: ${JSON.stringify(response?.error?.message)}`
      )
    }

    return {
      preVerificationGas: BigInt(response.result.preVerificationGas || 0),
      verificationGasLimit: BigInt(response.result.verificationGasLimit || 0),
      callGasLimit: BigInt(response.result.callGasLimit || 0),
      paymasterVerificationGasLimit: response.result
        .paymasterVerificationGasLimit
        ? BigInt(response.result.paymasterVerificationGasLimit)
        : undefined,
      paymasterPostOpGasLimit: response.result.paymasterPostOpGasLimit
        ? BigInt(response.result.paymasterPostOpGasLimit)
        : undefined
    }
  }

  /**
   *
   * @param userOp
   * @description This function will send signed userOp to bundler to get mined on chain
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(_userOp: UserOperationStruct): Promise<UserOpResponse> {
    const chainId = this.bundlerConfig.chainId
    const params = [deepHexlify(_userOp), this.bundlerConfig.entryPointAddress]
    const bundlerUrl = this.getBundlerUrl()
    const sendUserOperationResponse: { result: Hash } = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_sendUserOperation",
          params: params,
          id: getTimestampInSeconds(),
          jsonrpc: "2.0"
        }
      },
      "Bundler"
    )

    return {
      userOpHash: sendUserOperationResponse.result,
      wait: (confirmations?: number): Promise<UserOpReceipt> => {
        // Note: maxDuration can be defined per chainId
        const maxDuration =
          this.UserOpReceiptMaxDurationIntervals[chainId] || 30000 // default 30 seconds
        let totalDuration = 0

        return new Promise<UserOpReceipt>((resolve, reject) => {
          const intervalValue = this.UserOpReceiptIntervals[chainId] || 5000 // default 5 seconds
          const intervalId = setInterval(async () => {
            try {
              const userOpResponse = await this.getUserOpReceipt(
                sendUserOperationResponse.result
              )
              if (userOpResponse?.receipt?.blockNumber) {
                if (confirmations) {
                  const latestBlock = await this.provider.getBlockNumber()
                  const confirmedBlocks =
                    latestBlock - userOpResponse.receipt.blockNumber
                  if (confirmations >= confirmedBlocks) {
                    clearInterval(intervalId)
                    resolve(userOpResponse)
                    return
                  }
                } else {
                  clearInterval(intervalId)
                  resolve(userOpResponse)
                  return
                }
              }
            } catch (error) {
              clearInterval(intervalId)
              reject(error)
              return
            }

            totalDuration += intervalValue
            if (totalDuration >= maxDuration) {
              clearInterval(intervalId)
              reject(
                new Error(
                  `Exceeded maximum duration (${
                    maxDuration / 1000
                  } sec) waiting to get receipt for userOpHash ${
                    sendUserOperationResponse.result
                  }. Try getting the receipt manually using eth_getUserOperationReceipt rpc method on bundler`
                )
              )
            }
          }, intervalValue)
        })
      }
    }
  }

  /**
   *
   * @param userOpHash
   * @description This function will return userOpReceipt for a given userOpHash
   * @returns Promise<UserOpReceipt>
   */
  async getUserOpReceipt(userOpHash: string): Promise<UserOpReceipt> {
    const bundlerUrl = this.getBundlerUrl()
    const response: GetUserOperationReceiptResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_getUserOperationReceipt",
          params: [userOpHash],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0"
        }
      },
      "Bundler"
    )
    const userOpReceipt: UserOpReceipt = response.result
    return userOpReceipt
  }

  /**
   *
   * @param userOpHash
   * @description This function will return userOpReceipt for a given userOpHash
   * @returns Promise<UserOpReceipt>
   */
  async getUserOpStatus(userOpHash: string): Promise<UserOpStatus> {
    const bundlerUrl = this.getBundlerUrl()
    const response: GetUserOperationStatusResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "biconomy_getUserOperationStatus",
          params: [userOpHash],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0"
        }
      },
      "Bundler"
    )
    const userOpStatus: UserOpStatus = response.result
    return userOpStatus
  }

  /**
   *
   * @param userOpHash
   * @description this function will return UserOpByHashResponse for given UserOpHash
   * @returns Promise<UserOpByHashResponse>
   */
  async getUserOpByHash(userOpHash: string): Promise<UserOpByHashResponse> {
    const bundlerUrl = this.getBundlerUrl()
    const response: GetUserOpByHashResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_getUserOperationByHash",
          params: [userOpHash],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0"
        }
      },
      "Bundler"
    )
    const userOpByHashResponse: UserOpByHashResponse = response.result
    return userOpByHashResponse
  }

  /**
   * @description This function will return the gas fee values
   */
  async getGasFeeValues(): Promise<GetUserOperationGasPriceReturnType> {
    const bundlerUrl = this.getBundlerUrl()
    const response: { result: GetUserOperationGasPriceReturnType } =
      await sendRequest(
        {
          url: bundlerUrl,
          method: HttpMethod.Post,
          body: {
            method: "pimlico_getUserOperationGasPrice",
            params: [],
            id: getTimestampInSeconds(),
            jsonrpc: "2.0"
          }
        },
        "Bundler"
      )

    return {
      slow: {
        maxFeePerGas: BigInt(response.result.slow.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(response.result.slow.maxPriorityFeePerGas)
      },
      standard: {
        maxFeePerGas: BigInt(response.result.standard.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(
          response.result.standard.maxPriorityFeePerGas
        )
      },
      fast: {
        maxFeePerGas: BigInt(response.result.fast.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(response.result.fast.maxPriorityFeePerGas)
      }
    }
  }

  public static async create(config: Bundlerconfig): Promise<Bundler> {
    return new Bundler(config)
  }
}
