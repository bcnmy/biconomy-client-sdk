import { FallbackApiResponse, UserOperation } from 'Types'
import { PaymasterServiceDataType } from './PaymasterServiceTypes'

export interface IPaymasterAPI {
  getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: PaymasterServiceDataType
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
