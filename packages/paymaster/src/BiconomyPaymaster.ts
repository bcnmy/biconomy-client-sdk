import { Logger, sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation, Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import {
  PaymasterFeeQuote,
  PaymasterConfig,
  BiconomyTokenPaymasterFeeQuoteResponse,
  FeeQuotesOrDataDto,
  SponsorUserOperationDto
} from './types/Types'
import { BigNumberish, BigNumber, ethers } from 'ethers'
import { ERC20_ABI } from './constants' // temporary
import { BiconomyTokenPaymasterRequest } from './types/Types'
import { IPaymaster } from './interfaces/IPaymaster'

// WIP
// Hybrid - Generic Gas abstraction paymaster
// TODO: define return types, base class and interface usage
// This may inherit from TokenPaymasterAPI

export class BiconomyPaymaster implements IPaymaster {
  constructor(readonly paymasterConfig: PaymasterConfig) {}

  // May not be needed at all
  async getTokenApprovalAmount(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest
  ): Promise<BigNumberish> {
    if (tokenPaymasterRequest.maxApproval) {
      return ethers.constants.MaxUint256
    }
    return ethers.utils.parseUnits('10', 6)
  }

  // TODO // WIP
  // Note: maybe rename to createTokenApprovalTransaction
  async createTokenApprovalRequest(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction> {
    // Note: should also check in caller if the approval is already given

    const feeTokenAddress: string = tokenPaymasterRequest.feeQuote.tokenAddress
    Logger.log('erc20 fee token address ', feeTokenAddress)

    const requiredApproval: number = Math.floor(
      tokenPaymasterRequest.feeQuote.maxGasFee *
        Math.pow(10, tokenPaymasterRequest.feeQuote.decimal)
    )
    Logger.log('required approval for erc20 token ', requiredApproval)
    // Fallback to local helper if required
    // await this.getTokenApprovalAmount(tokenPaymasterRequest)

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

  // WIP: notice
  // Required Dto is different than "PaymasterServiceData"
  // here it is tokenInfo: -> preferredToken, tokenList (fully in context of token paymaster)
  // we could pass mode as well

  // pm_getFeeQuoteOrData
  /*{
    "mode": "ERC20",
    "tokenInfo": {
        "preferredToken": "0xdA5289FCAAF71d52A80A254dA614A192B693e976",
        "tokenList": [
            "0xdA5289FCAAF71d52A80A254dA614A192B693e975",
            "0xda5289fcaaf71d52a80a254da614a192b693e977",
            "0xeabc4b91d9375796aa4f69cc764a4ab509080a58"
        ]
    },
    "sponsorshipInfo": {
        "webhookData": {},
        "smartAccountInfo": {
            "name": "BICONOMY",
            "version": "1.0.0"
        }
    }
  }*/

  async getPaymasterFeeQuotes(
    userOp: Partial<UserOperation>,
    requestedTokens?: string[],
    preferredToken?: string
  ): Promise<BiconomyTokenPaymasterFeeQuoteResponse> {
    userOp = await resolveProperties(userOp)
    userOp.nonce = BigNumber.from(userOp.nonce).toHexString()
    userOp.callGasLimit = BigNumber.from(userOp.callGasLimit).toHexString()
    userOp.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toHexString()
    userOp.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString()
    userOp.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString()
    userOp.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toHexString()
    userOp.signature = '0x'
    userOp.paymasterAndData = '0x'

    Logger.log('preferred token address passed is ', preferredToken)

    Logger.log('userop is ', userOp)
    // userOp = hexifyUserOp(userOp)

    let feeTokensArray: string[] = []
    if (requestedTokens && requestedTokens.length != 0) {
      feeTokensArray = requestedTokens
    }

    const feeQuotes: Array<PaymasterFeeQuote> = []

    try {
      const response: any = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_getFeeQuoteOrData',
          params: [
            userOp,
            {
              mode: 'ERC20', // TODO // Review can be dynamic
              tokenInfo: { tokenList: feeTokensArray, preferredToken: preferredToken } //,
              // sponsorshipInfo: {}
            }
          ], // As per current API
          id: 4337,
          jsonrpc: '2.0'
        }
      })

      if (response && response.result) {
        Logger.log('feeInfo ', response.result)
        const feeQuotesResponse: Array<PaymasterFeeQuote> = response.result.feeQuotes
        const paymasterAddress: string = response.result.paymasterAddress
        // check all objects iterate and populate below calculation for all tokens
        return { feeQuotes: feeQuotesResponse, tokenPaymasterAddress: paymasterAddress }
      } else {
        // return empty fee quotes or throw
        return { feeQuotes, tokenPaymasterAddress: '' }
      }
    } catch (error) {
      Logger.error("can't query fee quotes: ", error)
      // return empty fee quotes or throw
      return { feeQuotes, tokenPaymasterAddress: '' }
    }
  }

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
      const response: any = await sendRequest({
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

      const response: any = await sendRequest({
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
        // TODO: decide how strictSponsorshipMode applies here
        // Usually it could be like fallback from sponsorpship pamaster to ERC20 paymaster
        if (!this.paymasterConfig.strictSponsorshipMode) {
          return '0x'
        }
        // Logger.log(result)
        // Review: If we will get a different code and result.message
        if (response.error) {
          Logger.log(response.error.toString())
          throw new Error(
            'Error in verifying gas sponsorship. Reason: '.concat(response.error.toString())
          )
        }
        throw new Error('Error in verifying gas sponsorship. Reason unknown')
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
