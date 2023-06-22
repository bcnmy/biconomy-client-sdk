import { Logger, sendRequest, HttpMethod, getTimestampInSeconds } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation, Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import {
  PaymasterFeeQuote,
  PaymasterConfig,
  BiconomyTokenPaymasterFeeQuoteResponse,
  FeeQuotesOrDataDto,
  SponsorUserOperationDto,
  PaymasterServiceSuccessResponse,
  BiconomyTokenPaymasterRequest,
  PaymasterMode
} from './utils/Types'
import { BigNumberish, BigNumber, ethers } from 'ethers'
import { ERC20_ABI } from './constants'
import { IHybridPaymaster } from './interfaces/IHybridPaymaster'

// Hybrid - Generic Gas Abstraction paymaster
/**
 *
 */
export class BiconomyPaymaster implements IHybridPaymaster {
  constructor(readonly paymasterConfig: PaymasterConfig) {}

  // Note: maybe rename to createTokenApprovalTransaction
  async createTokenApprovalRequest(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction> {
    const feeTokenAddress: string = tokenPaymasterRequest.feeQuote.tokenAddress
    Logger.log('erc20 fee token address ', feeTokenAddress)

    const spender = tokenPaymasterRequest.spender
    Logger.log('spender address ', spender)

    // TODO
    // Note: should also check in caller if the approval is already given, if yes return object with address or data 0
    // Note: we would need userOp here to get the account/owner info to check allowance

    let requiredApproval: BigNumberish = BigNumber.from(0)

    if (tokenPaymasterRequest.maxApproval && tokenPaymasterRequest.maxApproval == true) {
      requiredApproval = ethers.constants.MaxUint256
    } else {
      /*requiredApproval = ethers.BigNumber.from(
        tokenPaymasterRequest.feeQuote.maxGasFee.toString()
      ).mul(
        ethers.BigNumber.from(10).pow(
          ethers.BigNumber.from(tokenPaymasterRequest.feeQuote.decimal.toString())
        )
      )*/

      requiredApproval = BigNumber.from(
        Math.floor(
          tokenPaymasterRequest.feeQuote.maxGasFee *
            Math.pow(10, tokenPaymasterRequest.feeQuote.decimal)
        )
      )
    }

    Logger.log('required approval for erc20 token ', requiredApproval)

    const erc20 = new ethers.Contract(feeTokenAddress, ERC20_ABI, provider)

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
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [spender, requiredApproval])
    }
  }

  /**
   *
   * @param userOp
   * @param paymasterServiceData
   * @returns
   */
  async getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperation>,
    paymasterServiceData: FeeQuotesOrDataDto
  ): Promise<BiconomyTokenPaymasterFeeQuoteResponse | string> {
    userOp = await resolveProperties(userOp)
    userOp.nonce = BigNumber.from(userOp.nonce).toHexString()
    userOp.callGasLimit = BigNumber.from(userOp.callGasLimit).toHexString()
    userOp.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toHexString()
    userOp.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString()
    userOp.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString()
    userOp.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toHexString()
    userOp.signature = '0x'
    userOp.paymasterAndData = '0x'

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

    if (paymasterServiceData.tokenInfo) {
      if (paymasterServiceData.tokenInfo.preferredToken) {
        Logger.log('passed preferred token is ', paymasterServiceData.tokenInfo.preferredToken)
        preferredToken = paymasterServiceData.tokenInfo.preferredToken
      }
    }

    Logger.log('userop is ', userOp)

    if (
      paymasterServiceData.tokenInfo &&
      paymasterServiceData.tokenInfo.tokenList &&
      paymasterServiceData.tokenInfo.tokenList.length != 0
    ) {
      feeTokensArray = paymasterServiceData.tokenInfo.tokenList
    }

    const feeQuotes: Array<PaymasterFeeQuote> = []

    if (paymasterServiceData.sponsorshipInfo) {
      if (paymasterServiceData.sponsorshipInfo.webhookData) {
        webhookData = paymasterServiceData.sponsorshipInfo.webhookData
      }

      // Could check here that this must be provided
      if (paymasterServiceData.sponsorshipInfo.smartAccountInfo) {
        smartAccountInfo = paymasterServiceData.sponsorshipInfo.smartAccountInfo
      }
    }

    try {
      const response: PaymasterServiceSuccessResponse = await sendRequest({
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
          return paymasterAndData
        } else {
          throw new Error('Failed to fetch feeQuote or paymaster data')
        }
      } else {
        // Review if any case response.ok could be true and response would be below
        /*{
          "statusCode": 500,
          "message": "Internal server error"
        }*/
        // Note: we may not throw if we include strictMode off and return paymasterData '0x'.
        // pm service could handle this case by case. Needs Review
        throw new Error('Failed to fetch feeQuote or paymaster data')
      }
    } catch (error: any) {
      Logger.error("can't query fee quotes - reason: ", error)
      // Note: we may not throw if we include strictMode off and return paymasterData '0x'.
      throw new Error('Failed to fetch feeQuote or paymaster data' + error.toString())
    }
  }

  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: SponsorUserOperationDto // mode is necessary. partial context of token paymaster or verifying
  ): Promise<string> {
    try {
      userOp = await resolveProperties(userOp)
      userOp.nonce = BigNumber.from(userOp.nonce).toHexString()
      userOp.callGasLimit = BigNumber.from(userOp.callGasLimit).toHexString()
      userOp.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toHexString()
      userOp.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString()
      userOp.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString()
      userOp.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toHexString()
      userOp.signature = '0x'
      userOp.paymasterAndData = '0x'

      const response: PaymasterServiceSuccessResponse = await sendRequest({
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
        return response.result.paymasterAndData
      } else {
        // For consistent return
        return '0x'
      }
    } catch (err: any) {
      Logger.log('Error in verifying gas sponsorship. sending paymasterAndData 0x')
      Logger.error('Error in verifying gas sponsorship.', err.toString())
      return '0x'
      // throw new Error('Error in verifying gas sponsorship. Reason: '.concat(err.toString()))
    }
  }
}
