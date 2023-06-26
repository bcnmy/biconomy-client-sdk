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
  // Review: only needed if we need strict paymaster mode
  // Note: Rename to strictMode or strictPaymasterMode if used at all
  // strictSponsorshipMode?: boolean
}

// review types and naming convention
// meant for pm_sponsorUserOperation
export type SponsorUserOperationDto = {
  mode: PaymasterMode
  tokenInfo?: FeeTokenInfo
  sponsorshipInfo?: SponsorpshipInfo
}

// review types and naming convention
// meant for pm_getFeeQuoteOrData
export type FeeQuotesOrDataDto = {
  mode?: PaymasterMode
  tokenInfo?: FeeQuoteParams
  sponsorshipInfo?: SponsorpshipInfo
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
}

export enum PaymasterMode {
  ERC20 = 'ERC20',
  SPONSORED = 'SPONSORED'
}
