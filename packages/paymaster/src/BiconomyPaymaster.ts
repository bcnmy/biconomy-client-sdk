import { Logger, sendRequest, HttpMethod, getTimestampInSeconds } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation, Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import {
  PaymasterFeeQuote,
  PaymasterConfig,
  FeeQuotesOrDataResponse,
  FeeQuotesOrDataDto,
  SponsorUserOperationDto,
  JsonRpcResponse,
  BiconomyTokenPaymasterRequest,
  PaymasterMode
} from './utils/Types'
import { BigNumberish, BigNumber, ethers } from 'ethers'
import { ERC20_ABI } from './constants'
import { IHybridPaymaster } from './interfaces/IHybridPaymaster'

/**
 * @dev Hybrid - Generic Gas Abstraction paymaster
 */
export class BiconomyPaymaster implements IHybridPaymaster<SponsorUserOperationDto> {
  constructor(readonly paymasterConfig: PaymasterConfig) {}

  /**
   * @dev Prepares the user operation by resolving properties and converting certain values to hexadecimal format.
   * @param userOp The partial user operation.
   * @returns A Promise that resolves to the prepared partial user operation.
   */
  private async prepareUserOperation(
    userOp: Partial<UserOperation>
  ): Promise<Partial<UserOperation>> {
    userOp = await resolveProperties(userOp)
    userOp.nonce = BigNumber.from(userOp.nonce).toHexString()
    userOp.callGasLimit = BigNumber.from(userOp.callGasLimit).toNumber()
    userOp.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toNumber()
    userOp.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString()
    userOp.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString()
    userOp.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toNumber()
    userOp.signature = '0x'
    userOp.paymasterAndData = '0x'
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

    Logger.log('provider object passed ', provider)

    // TODO move below notes to separate method
    // Note: should also check in caller if the approval is already given, if yes return object with address or data 0
    // Note: we would need userOp here to get the account/owner info to check allowance

    let requiredApproval: BigNumberish = BigNumber.from(0)

    if (tokenPaymasterRequest.maxApproval && tokenPaymasterRequest.maxApproval == true) {
      requiredApproval = ethers.constants.MaxUint256
    } else {
      requiredApproval = BigNumber.from(
        Math.ceil(
          tokenPaymasterRequest.feeQuote.maxGasFee *
            Math.pow(10, tokenPaymasterRequest.feeQuote.decimal)
        )
      )
    }

    Logger.log('required approval for erc20 token ', requiredApproval)

    const erc20Interface = new ethers.utils.Interface(JSON.stringify(ERC20_ABI))

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
      data: erc20Interface.encodeFunctionData('approve', [spender, requiredApproval])
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
    userOp = await this.prepareUserOperation(userOp)

    let mode = null
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

    preferredToken = paymasterServiceData.tokenInfo?.preferredToken
      ? paymasterServiceData.tokenInfo.preferredToken
      : preferredToken

    Logger.log('userop is ', userOp)

    feeTokensArray = (
      paymasterServiceData.tokenInfo?.tokenList?.length !== 0
        ? paymasterServiceData.tokenInfo?.tokenList
        : feeTokensArray
    ) as string[]

    webhookData = paymasterServiceData.sponsorshipInfo?.webhookData ?? webhookData

    smartAccountInfo = paymasterServiceData.sponsorshipInfo?.smartAccountInfo ?? smartAccountInfo

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
          return { paymasterAndData: paymasterAndData }
        }
      }
    } catch (error) {
      Logger.error("can't query fee quotes - reason: ", error)
      // Note: we may not throw if we include strictMode off and return paymasterData '0x'.
      throw new Error('Failed to fetch feeQuote or paymaster data' + error?.toString())
    }
    // Review when including any strict mode
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
  ): Promise<string> {
    try {
      userOp = await this.prepareUserOperation(userOp)

      const response: JsonRpcResponse = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_sponsorUserOperation',
          params: [userOp, paymasterServiceData],
          id: getTimestampInSeconds(),
          jsonrpc: '2.0'
        }
      })

      Logger.log('verifying and signing service response', response)

      if (response && response.result) {
        return response.result
      }
    } catch (err) {
      Logger.log('Error in verifying gas sponsorship. sending paymasterAndData 0x')
      Logger.error('Error in verifying gas sponsorship.', err?.toString())
      return '0x'
      // depending on strictMode flag
      // throw new Error('Error in verifying gas sponsorship. Reason: '.concat(err.toString()))
    }
    // Review when including any strict mode
    throw new Error('Error in verifying gas sponsorship.')
  }
}
