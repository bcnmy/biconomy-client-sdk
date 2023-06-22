import { Logger, sendRequest, HttpMethod } from '@biconomy/common'
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
  BiconomyTokenPaymasterRequest
} from './utils/Types'
import { BigNumberish, BigNumber, ethers } from 'ethers'
// TODO
import { ERC20_ABI } from './constants' // temporary
import { IHybridPaymaster } from './interfaces/IHybridPaymaster'

// Hybrid - Generic Gas abstraction paymaster
/**
 *
 */
export class BiconomyPaymaster implements IHybridPaymaster {
  constructor(readonly paymasterConfig: PaymasterConfig) {}

  // TODO // WIP
  // Note: maybe rename to createTokenApprovalTransaction
  async createTokenApprovalRequest(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction> {
    // Note: should also check in caller if the approval is already given

    const feeTokenAddress: string = tokenPaymasterRequest.feeQuote.tokenAddress
    Logger.log('erc20 fee token address ', feeTokenAddress)

    // TODO: For some tokens we may need to set allowance to 0 first so that would return batch of transactions
    const requiredApproval: number = Math.floor(
      tokenPaymasterRequest.feeQuote.maxGasFee *
        Math.pow(10, tokenPaymasterRequest.feeQuote.decimal)
    )
    Logger.log('required approval for erc20 token ', requiredApproval)

    const spender = tokenPaymasterRequest.spender
    // fallback to fetch from member
    // this.paymasterAddress ? this.paymasterAddress : await this.getPaymasterAddress()
    // Might maintain two fields for token and verifying paymaster addresses

    const erc20 = new ethers.Contract(feeTokenAddress, ERC20_ABI, provider)

    return {
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [spender, requiredApproval.toString()])
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
    // userOp = hexifyUserOp(userOp)

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
              ...(mode !== null && { mode }), // Review can be dynamic
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
          id: 4337,
          jsonrpc: '2.0'
        }
      })

      if (response && response.result) {
        Logger.log('feeInfo ', response.result)
        if (response.result.mode == 'ERC20') {
          const feeQuotesResponse: Array<PaymasterFeeQuote> = response.result.feeQuotes
          const paymasterAddress: string = response.result.paymasterAddress
          // check all objects iterate and populate below calculation for all tokens
          return { feeQuotes: feeQuotesResponse, tokenPaymasterAddress: paymasterAddress }
        } else if (response.result.mode == 'SPONSORED') {
          const paymasterAndData: string = response.result.paymasterAndData
          return paymasterAndData
        } else {
          // Review
          return { feeQuotes, tokenPaymasterAddress: '' }
        }
      } else {
        // REVIEW
        // return empty fee quotes or throw
        return { feeQuotes, tokenPaymasterAddress: '' }
      }
    } catch (error) {
      Logger.error("can't query fee quotes: ", error)
      // REVIEW
      // return empty fee quotes or throw
      return { feeQuotes, tokenPaymasterAddress: '' }
    }
  }

  // async getPaymasterFeeQuotesOrData(userOp: Partial<UserOperation>) {}

  // TODO // WIP : maybe paymasterData needs full fee quote. It could be full fee quote or address.
  // but the type is different than the one required for feeQuotesOrData..

  // pm_sponsorUserOperation types
  /*{
    "mode": "SPONSORED", // mandatory
    "tokenInfo": {
        "feeTokenAddress": "0xeabc4b91d9375796aa4f69cc764a4ab509080a58"
    },
    "sponsorshipInfo": {
        "webhookData": {},
        "smartAccountInfo": {
            "name": "BICONOMY",
            "version": "1.0.0"
        }
    }
  }*/

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
          id: 1234,
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
      if (!this.paymasterConfig.strictSponsorshipMode) {
        Logger.log('sending paymasterAndData 0x')
        Logger.log('Reason ', err.toString())
        return '0x'
      }
      Logger.error('Error in verifying gas sponsorship.', err.toString())
      throw new Error('Error in verifying gas sponsorship. Reason: '.concat(err.toString()))
    }
  }
}
