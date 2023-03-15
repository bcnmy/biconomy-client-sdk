import { FallbackApiResponse, UserOperation } from 'Types'

export interface IPaymasterAPI {
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>
}

export interface IFallbackAPI {
  getDappIdentifierAndSign(userOp: Partial<UserOperation>): Promise<FallbackApiResponse>
}
