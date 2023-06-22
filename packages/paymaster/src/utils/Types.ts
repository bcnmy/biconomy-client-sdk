// TODO
// Review this response
export type PaymasterAndDataResponse = {
  statusCode: number
  data: {
    paymasterAndData: string
  }
}

export type PaymasterServiceSuccessResponse = {
  jsonrpc: string
  id: number
  result: any
}

export type PaymasterServiceErrorResponse = {
  jsonrpc: string
  id: number
  error: JsonRpcError
}

export type JsonRpcError = {
  code: string
  message: string
  data: any
}

// TODO
export type PaymasterConfig = {
  paymasterUrl: string
  strictSponsorshipMode?: boolean // Review if optional and applies to config for all classes
}

// TODO
// review
// meant for pm_sponsorUserOperation
export type SponsorUserOperationDto = {
  mode: string // todo: should make acceptable enums
  tokenInfo?: FeeTokenInfo
  sponsorshipInfo?: SponsorpshipInfo
}

// TODO
// review
// meant for pm_getFeeQuoteOrData
export type FeeQuotesOrDataDto = {
  mode?: string // todo: should make acceptable enums
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

export type BiconomyTokenPaymasterFeeQuoteResponse = {
  feeQuotes: PaymasterFeeQuote[]
  tokenPaymasterAddress: string // spender
}
