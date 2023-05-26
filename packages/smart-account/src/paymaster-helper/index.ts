import { PaymasterAPI } from '@biconomy/account-abstraction'
import { BiconomyVerifyingPaymasterAPI } from '@biconomy/account-abstraction'
import { BiconomyTokenPaymasterAPI } from '@biconomy/account-abstraction'

export type SupportedGasToken = 'USDC' | 'TEST_ERC20'

export async function getPaymaster(
  paymasterUrl: string,
  chainId: number,
  entryPointAddress: string,
  feeToken?: string
): Promise<PaymasterAPI> {
  const tokenAddress = ''
  // todo // review
  // get the tokenAddress based on what is requested
  // we could have token less instance and override when making a request. need to think about this

  if (tokenAddress !== undefined) {
    const paymasterAddress = '' // get paymaster address from config or elsewhere api call to paymasterUrl
    if (paymasterAddress !== undefined) {
      return new BiconomyTokenPaymasterAPI({})
    }
  }
  // return new BiconomyVerifyingPaymasterAPI({})
}
