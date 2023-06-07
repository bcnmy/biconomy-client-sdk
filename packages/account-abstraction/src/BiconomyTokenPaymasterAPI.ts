import { resolveProperties } from '@ethersproject/properties'
import { ethers, BigNumberish } from 'ethers'
import { UserOperation } from '@biconomy/core-types'
import { HttpMethod, sendRequest } from './utils/httpRequests'
import { PaymasterConfig, PaymasterServiceDataType, TokenPaymasterData } from '@biconomy/core-types'
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

  async getPaymasterAddress(): Promise<string> {
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
  }

  async getTokenApprovalAmount(
    feeTokenAddress: string,
    maxApprove?: boolean
  ): Promise<BigNumberish> {
    if (maxApprove) {
      return ethers.constants.MaxUint256
    }

    // check the allowance provided on the paymaster
    // Todo: make an optional flag if someone wants to provide infitite approval
    // otherwise we need to give accurate allowance: would need fee quote for this

    // Temp values
    Logger.log('fee token address ', feeTokenAddress)
    return ethers.utils.parseUnits('10', 6)
  }

  async createTokenApprovalRequest(
    feeTokenAddress: string,
    provider: Provider,
    maxApprove = false
  ): Promise<Transaction> {
    // Note: ideally should also check in caller if the approval is already given
    const erc20 = new ethers.Contract(feeTokenAddress, ERC20_ABI, provider)

    return {
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [
        this.paymasterAddress || (await this.getPaymasterAddress()),
        await this.getTokenApprovalAmount(erc20.address, maxApprove)
      ])
    }
  }

  // WIP
  // Response to be defined
  async getFeeQuotes(
    userOp: Partial<UserOperation>,
    requestedTokens?: string[],
    preferredToken?: string
  ) {
    Logger.log('preferred token address passed is ', preferredToken)
    let feeTokensArray: string[] = []
    if (requestedTokens && requestedTokens.length != 0) {
      feeTokensArray = requestedTokens
    }
    // const callGasLimit = userOp.callGasLimit
    // const verificationGasLimit = userOp.verificationGasLimit
    // const preVerificationGas = userOp.preVerificationGas
    // const maxFeePerGas = userOp.maxFeePerGas

    const requiredPrefund = ethers.BigNumber.from(userOp.callGasLimit)
      .add(ethers.BigNumber.from(userOp.verificationGasLimit).mul(3))
      .add(ethers.BigNumber.from(userOp.preVerificationGas))
      .mul(ethers.BigNumber.from(userOp.maxFeePerGas))

    Logger.log('required prefund in wei ', requiredPrefund.toString())

    try {
      const response: any = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_getFeeQuote',
          params: feeTokensArray, // As per current API
          id: 4337,
          jsonrpc: '2.0'
        }
      })

      if (response && response.result) {
        const feeInfo = response.result
        Logger.log('feeInfo ', feeInfo)

        // sample result
        /*"result": {
          "0xda5289fcaaf71d52a80a254da614a192b693e977": {
              "exchangeRate": 1272265,
              "decimal": 6,
              "symbol": "USDC"
          }
        }*/

        // check all objects iterate and populate below calculation for all tokens

        // quote in specific token terms
        /*requiredPrefund
          .mul(exchangeRate)
          .div(ethers.constants.WeiPerEther)
          .toString()*/
      } else {
        // return empty fee quotes or throw
      }
    } catch (error) {
      Logger.error("can't query fee quotes: ", error)
      // return empty fee quotes or throw
    }
  }

  async getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: TokenPaymasterData
  ): Promise<string> {
    try {
      userOp = await resolveProperties(userOp)

      // userOp = hexifyUserOp(userOp)

      userOp.nonce = Number(userOp.nonce)
      userOp.callGasLimit = Number(userOp.callGasLimit)
      userOp.verificationGasLimit = Number(userOp.verificationGasLimit)
      userOp.maxFeePerGas = Number(userOp.maxFeePerGas)
      userOp.maxPriorityFeePerGas = Number(userOp.maxPriorityFeePerGas)
      userOp.preVerificationGas = Number(userOp.preVerificationGas)
      userOp.signature = '0x'
      userOp.paymasterAndData = '0x'

      const result: any = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: 'pm_sponsorUserOperation',
          params: [userOp, paymasterServiceData],
          id: 1234,
          jsonrpc: '2.0'
        }
      })

      Logger.log('verifying and signing service response', result)

      if (result && result.result) {
        return result.result.paymasterAndData
      } else {
        // TODO: decide how strictSponsorshipMode applies here
        // Usually it could be like fallback from sponsorpship pamaster to ERC20 paymaster
        if (!this.paymasterConfig.strictSponsorshipMode) {
          return '0x'
        }
        // Logger.log(result)
        // Review: If we will get a different code and result.message
        if (result.error) {
          Logger.log(result.error.toString())
          throw new Error(
            'Error in verifying gas sponsorship. Reason: '.concat(result.error.toString())
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
