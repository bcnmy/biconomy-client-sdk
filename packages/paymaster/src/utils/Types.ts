import { BigNumberish } from 'ethers'

export type PaymasterServiceErrorResponse = {
  jsonrpc: string
  id: number
  error: JsonRpcError
}

// Generic
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcResponse = {
  jsonrpc: string
  id: number
  result?: any
  error?: JsonRpcError
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcError = {
  code: string
  message: string
  data: any
}

export type PaymasterConfig = {
  paymasterUrl: string
  strictMode?: boolean
}

// <<review>> types and naming convention
// meant for pm_sponsorUserOperation
export type SponsorUserOperationDto = {
  mode: PaymasterMode
  calculateGasLimits?: boolean
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  smartAccountInfo?: SmartAccountData
  feeTokenAddress?: string
}

// <<review>> types and naming convention
// meant for pm_getFeeQuoteOrData
export type FeeQuotesOrDataDto = {
  mode?: PaymasterMode
  calculateGasLimits?: boolean
  tokenList?: string[]
  preferredToken?: string
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  smartAccountInfo?: SmartAccountData
}

export type FeeQuoteParams = {
  tokenList?: string[]
  preferredToken?: string
}

export type FeeTokenInfo = {
  feeTokenAddress: string
}

export type SponsorpshipInfo = {
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  smartAccountInfo: SmartAccountData
}

export type SmartAccountData = {
  name: string
  version: string
}

export type PaymasterFeeQuote = {
  symbol: string
  tokenAddress: string
  decimal: number
  logoUrl?: string
  maxGasFee: number
  maxGasFeeUSD?: number
  usdPayment?: number
  premiumPercentage: number
  validUntil?: number
}

export type BiconomyTokenPaymasterRequest = {
  feeQuote: PaymasterFeeQuote
  spender: string
  maxApproval?: boolean
}

export type FeeQuotesOrDataResponse = {
  feeQuotes?: PaymasterFeeQuote[]
  tokenPaymasterAddress?: string // spender
  paymasterAndData?: string
  preVerificationGas?: BigNumberish
  verificationGasLimit?: BigNumberish
  callGasLimit?: BigNumberish
}

export type PaymasterAndDataResponse = {
  paymasterAndData: string
  preVerificationGas?: BigNumberish
  verificationGasLimit?: BigNumberish
  callGasLimit?: BigNumberish
}

export enum PaymasterMode {
  ERC20 = 'ERC20',
  SPONSORED = 'SPONSORED'
}
