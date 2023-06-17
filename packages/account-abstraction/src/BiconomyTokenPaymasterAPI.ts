import { resolveProperties } from '@ethersproject/properties'
import { ethers, BigNumberish, BigNumber } from 'ethers'
import { PaymasterFeeQuote, UserOperation } from '@biconomy/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { PaymasterConfig, TokenPaymasterData } from '@biconomy/core-types'
import { Logger } from '@biconomy/common'
import { PaymasterAPI } from './PaymasterAPI'
import { ERC20_ABI, ERC20_APPROVAL_AMOUNT, PAYMASTER_ADDRESS } from './constants'
import { Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import { hexifyUserOp } from './utils'

/**
 * ERC20 Token Paymaster API supported via Biconomy dahsboard to enable Gas payments in ERC20 tokens
 */
export class BiconomyTokenPaymasterAPI extends PaymasterAPI<TokenPaymasterData> {
  constructor(readonly paymasterConfig: PaymasterConfig) {
    super()
  }

  /*async getPaymasterAddress(): Promise<string> {
    try {
      const response: any = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_getPaymasterType',
          params: [],
          id: 4337,
          jsonrpc: '2.0'
        }
      })

      if (response && response.result && response.result.address) {
        this.paymasterAddress = response.result.address
      }
    } catch (error) {
      Logger.error("can't query paymaster type and address error: ", error)
    }

    return this.paymasterAddress || PAYMASTER_ADDRESS
  }*/

  async getTokenApprovalAmount(
    feeTokenAddress: string,
    maxApprove?: boolean
  ): Promise<BigNumberish> {
    if (maxApprove) {
      return ethers.constants.MaxUint256
    }

    Logger.log('fee token address in getting approval amount ', feeTokenAddress)

    // check the allowance provided on the paymaster
    // Todo: make an optional flag if someone wants to provide infitite approval
    // otherwise we need to give accurate allowance: would need fee quote for this

    // Temp values
    const approvalAmount = ethers.utils.parseUnits('10', 6)
    Logger.log('approval amount ', approvalAmount.toString())
    return approvalAmount
  }

  async createTokenApprovalRequest(
    feeTokenAddress: string,
    provider: Provider,
    maxApprove = false
  ): Promise<Transaction> {
    // Note: ideally should also check in caller if the approval is already given
    const erc20 = new ethers.Contract(feeTokenAddress, ERC20_ABI, provider)
    const approvalAmount = await this.getTokenApprovalAmount(feeTokenAddress, maxApprove)
    // TODO // fix with optional spender as part of request
    const spender = this.paymasterAddress ? this.paymasterAddress : "" //: await this.getPaymasterAddress()

    return {
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [spender, approvalAmount])
    }
  }

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

  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: TokenPaymasterData
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
