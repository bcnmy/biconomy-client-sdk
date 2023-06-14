// TODO
// Review this response
export type PaymasterAndDataResponse = {
  statusCode: number
  data: {
    paymasterAndData: string
  }
}

// TODO
export type PaymasterConfig = {
  paymasterUrl: string
  strictSponsorshipMode?: boolean // Review if optional and applies to config for all classes
}

export type PaymasterServiceDataType = {
  tokenPaymasterData?: TokenPaymasterData
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  smartAccountData?: SmartAccountData
}

export type TokenPaymasterData = {
  feeTokenAddress: string
}

export type SmartAccountData = {
  name: string
  version: string
}

export type VerifyingPaymasterData = {
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  smartAccountTypeVersionData: SmartAccountData
}

export type PaymasterFeeQuote = {
  symbol: string
  tokenAddress: string
  decimal?: number
  logoUrl?: string
  maxGasFee: number
  maxGasFeeUSD?: number
  usdPayment?: number
  premiumMultiplier: number
  validUntil?: number
}
