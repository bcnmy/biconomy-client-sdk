export type PaymasterAndDataResponse = {
  statusCode: number
  data: {
    paymasterAndData: string
  }
}

export type PaymasterConfig = {
  paymasterUrl: string,
  strictSponsorshipMode?: boolean,
  apiKey: string
}