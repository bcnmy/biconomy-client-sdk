import { Logger, sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation, Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import { PaymasterAPI } from './Paymaster'
import {
  PaymasterFeeQuote,
  TokenPaymasterData,
  PaymasterConfig,
  PaymasterServiceDataType
} from './types/Types'
import { BigNumberish, BigNumber, ethers } from 'ethers'
import { ERC20_ABI, ERC20_APPROVAL_AMOUNT, PAYMASTER_ADDRESS } from './constants' // temporary
import { BiconomyTokenPaymasterRequest } from './types/Types'

// WIP
// Hybrid - Generic Gas abstraction paymaster
// TODO: define return types, base class and interface usage
// This may inherit from TokenPaymasterAPI
// or May not need it At All
export class BiconomyPaymaster extends PaymasterAPI<TokenPaymasterData> {
  constructor(readonly paymasterConfig: PaymasterConfig) {
    super()
  }

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
  async createTokenApprovalRequest(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction> {
    // Note: should also check in caller if the approval is already given

    const feeTokenAddress: string = tokenPaymasterRequest.feeQuote.tokenAddress
    Logger.log('erc20 fee token address ', feeTokenAddress)

    const requiredApproval: number =
      tokenPaymasterRequest.feeQuote.maxGasFee * tokenPaymasterRequest.feeQuote.decimal
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
  async getPaymasterFeeQuotes(
    userOp: Partial<UserOperation>,
    requestedTokens?: string[],
    preferredToken?: string
  ): Promise<PaymasterFeeQuote[]> {
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
              mode: 'ERC20',
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
        // check all objects iterate and populate below calculation for all tokens
        return feeQuotesResponse
      } else {
        // return empty fee quotes or throw
        return feeQuotes
      }
    } catch (error) {
      Logger.error("can't query fee quotes: ", error)
      // return empty fee quotes or throw
      return feeQuotes
    }
  }

  // async getPaymasterFeeQuotesOrData(userOp: Partial<UserOperation>) {}

  // TODO // WIP : maybe paymasterData needs full fee quote. It could be full fee quote or address.
  // but the type is different than the one required for feeQuotesOrData..
  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: TokenPaymasterData // mode is necessary. partial context of token paymaster or verifying
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
