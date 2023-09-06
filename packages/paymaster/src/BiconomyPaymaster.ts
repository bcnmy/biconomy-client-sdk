import { Logger, sendRequest, HttpMethod, getTimestampInSeconds } from '@biconomy-devx/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation, Transaction } from '@biconomy-devx/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import {
  PaymasterFeeQuote,
  PaymasterConfig,
  FeeQuotesOrDataResponse,
  FeeQuotesOrDataDto,
  SponsorUserOperationDto,
  JsonRpcResponse,
  BiconomyTokenPaymasterRequest,
  PaymasterMode,
  PaymasterAndDataResponse
} from './utils/Types'
import { BigNumberish, BigNumber, ethers } from 'ethers'
import { ERC20_ABI } from './constants'
import { IHybridPaymaster } from './interfaces/IHybridPaymaster'

const defaultPaymasterConfig: PaymasterConfig = {
  paymasterUrl: '',
  strictMode: true // Set your desired default value for strictMode here
}
/**
 * @dev Hybrid - Generic Gas Abstraction paymaster
 */
export class BiconomyPaymaster implements IHybridPaymaster<SponsorUserOperationDto> {
  paymasterConfig: PaymasterConfig
  constructor(config: PaymasterConfig) {
    const mergedConfig: PaymasterConfig = {
      ...defaultPaymasterConfig,
      ...config
    }
    this.paymasterConfig = mergedConfig
  }

  /**
   * @dev Prepares the user operation by resolving properties and converting certain values to hexadecimal format.
   * @param userOp The partial user operation.
   * @returns A Promise that resolves to the prepared partial user operation.
   */
  private async prepareUserOperation(
    userOp: Partial<UserOperation>
  ): Promise<Partial<UserOperation>> {
    // Review
    userOp = await resolveProperties(userOp)
    if (userOp.nonce) {
      userOp.nonce = BigNumber.from(userOp.nonce).toHexString()
    }
    if (userOp.callGasLimit) {
      userOp.callGasLimit = BigNumber.from(userOp.callGasLimit).toString()
    }
    if (userOp.verificationGasLimit) {
      userOp.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toString()
    }
    if (userOp.preVerificationGas) {
      userOp.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toString()
    }
    userOp.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString()
    userOp.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString()
    userOp.signature = userOp.signature || '0x'
    userOp.paymasterAndData = userOp.paymasterAndData || '0x'
    return userOp
  }

  /**
   * @dev Builds a token approval transaction for the Biconomy token paymaster.
   * @param tokenPaymasterRequest The token paymaster request data. This will include information about chosen feeQuote, spender address and optional flag to provide maxApproval
   * @param provider Optional provider object.
   * @returns A Promise that resolves to the built transaction object.
   */
  async buildTokenApprovalTransaction(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider?: Provider
  ): Promise<Transaction> {
    const feeTokenAddress: string = tokenPaymasterRequest.feeQuote.tokenAddress
    Logger.log('erc20 fee token address ', feeTokenAddress)

    const spender = tokenPaymasterRequest.spender
    Logger.log('spender address ', spender)

    // logging provider object isProvider
    Logger.log('provider object passed - is provider', provider?._isProvider)

    // TODO move below notes to separate method
    // Note: should also check in caller if the approval is already given, if yes return object with address or data 0
    // Note: we would need userOp here to get the account/owner info to check allowance

    let requiredApproval: BigNumberish = BigNumber.from(0).toString()

    if (tokenPaymasterRequest.maxApproval && tokenPaymasterRequest.maxApproval == true) {
      requiredApproval = ethers.constants.MaxUint256
    } else {
      requiredApproval = Math.ceil(
        tokenPaymasterRequest.feeQuote.maxGasFee *
          Math.pow(10, tokenPaymasterRequest.feeQuote.decimal)
      ).toString()
    }

    Logger.log('required approval for erc20 token ', requiredApproval)

    const erc20Interface = new ethers.utils.Interface(JSON.stringify(ERC20_ABI))

    try {
      const data = erc20Interface.encodeFunctionData('approve', [spender, requiredApproval])

      // TODO?
      // Note: For some tokens we may need to set allowance to 0 first so that would return batch of transactions and changes the return type to Transaction[]
      // In that case we would return two objects in an array, first of them being..
      /*
    {
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [spender, BigNumber.from("0")])
    }
    */

      return {
        to: feeTokenAddress,
        value: ethers.BigNumber.from(0),
        data: data
      }
    } catch (error) {
      Logger.error('Error encoding function data:', error)
      throw new Error('Failed to encode function data')
    }
  }

  /**
   * @dev Retrieves paymaster fee quotes or data based on the provided user operation and paymaster service data.
   * @param userOp The partial user operation.
   * @param paymasterServiceData The paymaster service data containing token information and sponsorship details. Devs can send just the preferred token or array of token addresses in case of mode "ERC20" and sartAccountInfo in case of "sponsored" mode.
   * @returns A Promise that resolves to the fee quotes or data response.
   */
  async getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperation>,
    paymasterServiceData: FeeQuotesOrDataDto
  ): Promise<FeeQuotesOrDataResponse> {
    try {
      userOp = await this.prepareUserOperation(userOp)
    } catch (err) {
      Logger.log('Error in prepareUserOperation ', err)
      throw err
    }

    let mode = null
    const calculateGasLimits = paymasterServiceData.calculateGasLimits
      ? paymasterServiceData.calculateGasLimits
      : false
    Logger.log('calculateGasLimits is ', calculateGasLimits)
    let preferredToken = null
    let feeTokensArray: string[] = []
    // could make below null
    let smartAccountInfo = {
      name: 'BICONOMY',
      version: '1.0.0'
    }
    let webhookData = null

    if (paymasterServiceData.mode) {
      Logger.log('Requested mode is ', paymasterServiceData.mode)
      mode = paymasterServiceData.mode
      // Validation on the mode passed / define allowed enums
    }

    preferredToken = paymasterServiceData?.preferredToken
      ? paymasterServiceData?.preferredToken
      : preferredToken

    Logger.log('userop is ', userOp)

    feeTokensArray = (
      paymasterServiceData?.tokenList?.length !== 0
        ? paymasterServiceData?.tokenList
        : feeTokensArray
    ) as string[]

    webhookData = paymasterServiceData?.webhookData ?? webhookData

    smartAccountInfo = paymasterServiceData?.smartAccountInfo ?? smartAccountInfo

    try {
      const response: JsonRpcResponse = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_getFeeQuoteOrData',
          params: [
            userOp,
            {
              ...(mode !== null && { mode }),
              calculateGasLimits: calculateGasLimits,
              tokenInfo: {
                tokenList: feeTokensArray,
                ...(preferredToken !== null && { preferredToken })
              },
              sponsorshipInfo: {
                ...(webhookData !== null && { webhookData }),
                smartAccountInfo: smartAccountInfo
              }
            }
          ], // As per current API
          id: getTimestampInSeconds(),
          jsonrpc: '2.0'
        }
      })

      if (response && response.result) {
        Logger.log('feeInfo ', response.result)
        if (response.result.mode == PaymasterMode.ERC20) {
          const feeQuotesResponse: Array<PaymasterFeeQuote> = response.result.feeQuotes
          const paymasterAddress: string = response.result.paymasterAddress
          // check all objects iterate and populate below calculation for all tokens
          return { feeQuotes: feeQuotesResponse, tokenPaymasterAddress: paymasterAddress }
        } else if (response.result.mode == PaymasterMode.SPONSORED) {
          const paymasterAndData: string = response.result.paymasterAndData
          const preVerificationGas = response.result.preVerificationGas
          const verificationGasLimit = response.result.verificationGasLimit
          const callGasLimit = response.result.callGasLimit
          return {
            paymasterAndData: paymasterAndData,
            preVerificationGas: preVerificationGas,
            verificationGasLimit: verificationGasLimit,
            callGasLimit: callGasLimit
          }
        } else {
          const errorObject = {
            code: 417,
            message: 'Expectation Failed: Invalid mode in Paymaster service response'
          }
          throw errorObject
        }
      }
    } catch (error: any) {
      Logger.log(error.message)
      Logger.error('Failed to fetch Fee Quotes or Paymaster data - reason: ', JSON.stringify(error))
      // Note: we may not throw if we include strictMode off and return paymasterData '0x'.
      if (
        !this.paymasterConfig.strictMode &&
        paymasterServiceData.mode == PaymasterMode.SPONSORED &&
        (error?.message.includes('Smart contract data not found') ||
          error?.message.includes('No policies were set'))
        // can also check based on error.code being -32xxx
      ) {
        Logger.log(`Strict mode is ${this.paymasterConfig.strictMode}. sending paymasterAndData 0x`)
        return {
          paymasterAndData: '0x',
          // send below values same as userOp gasLimits
          preVerificationGas: userOp.preVerificationGas,
          verificationGasLimit: userOp.verificationGasLimit,
          callGasLimit: userOp.callGasLimit
        }
      }
      throw error
    }
    throw new Error('Failed to fetch feeQuote or paymaster data')
  }

  /**
   * @dev Retrieves the paymaster and data based on the provided user operation and paymaster service data.
   * @param userOp The partial user operation.
   * @param paymasterServiceData Optional paymaster service data.
   * @returns A Promise that resolves to the paymaster and data string.
   */
  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: SponsorUserOperationDto // mode is necessary. partial context of token paymaster or verifying
  ): Promise<PaymasterAndDataResponse> {
    // TODO
    try {
      userOp = await this.prepareUserOperation(userOp)
    } catch (err) {
      Logger.log('Error in prepareUserOperation ', err)
      throw err
    }

    if (paymasterServiceData?.mode === undefined) {
      throw new Error('mode is required in paymasterServiceData')
    }

    const mode = paymasterServiceData.mode
    Logger.log('requested mode is ', mode)

    const calculateGasLimits = paymasterServiceData?.calculateGasLimits
      ? paymasterServiceData.calculateGasLimits
      : false
    Logger.log('calculateGasLimits is ', calculateGasLimits)

    let tokenInfo = null
    // could make below null
    let smartAccountInfo = {
      name: 'BICONOMY',
      version: '1.0.0'
    }
    let webhookData = null

    if (mode === PaymasterMode.ERC20) {
      if (
        !paymasterServiceData?.feeTokenAddress &&
        paymasterServiceData?.feeTokenAddress === ethers.constants.AddressZero
      ) {
        throw new Error('feeTokenAddress is required and should be non-zero')
      }
      tokenInfo = {
        feeTokenAddress: paymasterServiceData.feeTokenAddress
      }
    }

    webhookData = paymasterServiceData?.webhookData ?? webhookData
    smartAccountInfo = paymasterServiceData?.smartAccountInfo ?? smartAccountInfo

    // Note: The idea is before calling this below rpc, userOp values presense and types should be in accordance with how we call eth_estimateUseropGas on the bundler

    try {
      const response: JsonRpcResponse = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_sponsorUserOperation',
          params: [
            userOp,
            {
              mode: mode,
              calculateGasLimits: calculateGasLimits,
              ...(tokenInfo !== null && { tokenInfo }),
              sponsorshipInfo: {
                ...(webhookData !== null && { webhookData }),
                smartAccountInfo: smartAccountInfo
              }
            }
          ],
          id: getTimestampInSeconds(),
          jsonrpc: '2.0'
        }
      })

      Logger.log('verifying and signing service response', response)

      if (response && response.result) {
        const paymasterAndData: string = response.result.paymasterAndData
        const preVerificationGas = response.result.preVerificationGas
        const verificationGasLimit = response.result.verificationGasLimit
        const callGasLimit = response.result.callGasLimit
        return {
          paymasterAndData: paymasterAndData,
          preVerificationGas: preVerificationGas,
          verificationGasLimit: verificationGasLimit,
          callGasLimit: callGasLimit
        }
      }
    } catch (error: any) {
      Logger.log(error.message)
      Logger.error('Error in generating paymasterAndData - reason: ', JSON.stringify(error))
      if (
        !this.paymasterConfig.strictMode &&
        (error?.message.includes('Smart contract data not found') ||
          error?.message.includes('No policies were set'))
        // can also check based on error.code being -32xxx
      ) {
        Logger.log(`Strict mode is ${this.paymasterConfig.strictMode}. sending paymasterAndData 0x`)
        return {
          paymasterAndData: '0x',
          // send below values same as userOp gasLimits
          preVerificationGas: userOp.preVerificationGas,
          verificationGasLimit: userOp.verificationGasLimit,
          callGasLimit: userOp.callGasLimit
        }
      }
      throw error
    }
    throw new Error('Error in generating paymasterAndData')
  }

  /**
   *
   * @param userOp user operation
   * @param paymasterServiceData optional extra information to be passed to paymaster service
   * @returns paymasterAndData with valid length but mock signature
   */
  async getDummyPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: SponsorUserOperationDto // mode is necessary. partial context of token paymaster or verifying
  ): Promise<string> {
    Logger.log('userOp is ', userOp)
    Logger.log('paymasterServiceData is ', paymasterServiceData)
    return '0x'
  }
}
