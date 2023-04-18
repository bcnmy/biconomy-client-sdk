import { FallbackApiResponse, UserOperation } from 'Types'

export interface IPaymasterAPI {
  getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: object
  ): Promise<string>
}

export type PaymasterConfig = {
  signingServiceUrl: string
  dappAPIKey: string
  strictSponsorshipMode: boolean
}

export interface IFallbackAPI {
  getDappIdentifierAndSign(userOp: Partial<UserOperation>): Promise<FallbackApiResponse>
}
