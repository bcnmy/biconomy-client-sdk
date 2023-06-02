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

export type VerifyingPaymasterData = {
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
}

export type SmartAccountData = {
  name: string
  version: string
}
