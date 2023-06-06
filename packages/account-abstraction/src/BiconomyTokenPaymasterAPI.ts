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
    // TODO: update with below way shared by PM service team
    const result: any = await sendRequest({
      url: `${this.paymasterConfig.paymasterUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'pm_supportedPaymasters',
        params: [],
        id: 1234,
        jsonrpc: '2.0'
      }
    })

    if (result && result.data && result.statusCode === 200) {
      return result.data.paymasterAddresses[0] // temp random
    }

    return PAYMASTER_ADDRESS
  }

  async getTokenApprovalAmount(feeTokenAddress: string): Promise<BigNumberish> {
    Logger.log('fee token address ', feeTokenAddress)
    return ethers.utils.parseUnits('10', 6)
  }

  async createTokenApprovalRequest(
    feeTokenAddress: string,
    provider: Provider
  ): Promise<Transaction> {
    // Note: ideally should also check in caller if the approval is already given
    const erc20 = new ethers.Contract(feeTokenAddress, ERC20_ABI, provider)

    return {
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [
        PAYMASTER_ADDRESS, //await this.getPaymasterAddress(),
        ERC20_APPROVAL_AMOUNT[erc20.address] // await this.getTokenApprovalAmount(erc20.address)
      ])
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
        return result.result.tokenPaymasterAndData
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
