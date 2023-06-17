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

export type TokenInfo = {
  feeTokenAddress: string
}

export type SponsorpshipInfo = {
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  smartAccountInfo: SmartAccountData
}

export type TokenPaymasterData = {
  mode?: string // todo: should make acceptable enums
  tokenInfo: TokenInfo
  sponsorshipInfo?: SponsorpshipInfo
}

export type SmartAccountData = {
  name: string
  version: string
}

// TODO // to be updated
export type VerifyingPaymasterData = {
  mode?: string
  tokenInfo?: TokenInfo // never used for verifying paymaster class
  sponsorshipInfo?: SponsorpshipInfo
}

export type PaymasterFeeQuote = {
  symbol: string
  tokenAddress: string
  decimal?: number
  logoUrl?: string
  maxGasFee: number
  maxGasFeeUSD?: number
  usdPayment?: number
  premiumPercentage: number
  validUntil?: number
}
