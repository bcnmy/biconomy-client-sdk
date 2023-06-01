export type PaymasterAndDataResponse = {
  statusCode: number
  data: {
    paymasterAndData: string
  }
}

export type PaymasterConfig = {
  paymasterServiceUrl: string,
  strictSponsorshipMode?: boolean,
  dappAPIKey: string
}