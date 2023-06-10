import { Logger, sendRequest, HttpMethod } from '@biconomy/common'
import { resolveProperties } from '@ethersproject/properties'
import { UserOperation, Transaction } from '@biconomy/core-types'
import { Provider } from '@ethersproject/abstract-provider'
import { PaymasterAPI } from './Paymaster'
import {
  FeeTokenData,
  PaymasterFeeQuote,
  TokenPaymasterData,
  PaymasterConfig,
  PaymasterServiceDataType
} from './types/Types'
import { BigNumberish, ethers } from 'ethers'
import { BiconomyTokenPaymasterAPI } from './BiconomyTokenPaymaster'

// WIP
// Hybrid paymaster
// TODO: define return types, base class and interface usage
// This may inherit from TokenPaymasterAPI
export class BiconomyGasAbstractionPaymasterAPI extends PaymasterAPI<TokenPaymasterData> {
  // we will be calling pm_getFeeQuoteOrData from here and handle the flow accordingly
}
