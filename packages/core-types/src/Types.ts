export type SmartAccountVersion = '1.0.1' | '1.0.0' | '1.0.2'

export enum OperationType {
  Call, // 0
  DelegateCall // 1
}

export type Eip3770Address = {
  prefix: string
  address: string
}

// review
export type RelayResponse = {
  code?: number
  message?: string
  transactionId?: string
  hash?: string
  error?: string
  connectionUrl?: string
}
export type UserOperation = {
  sender: string
  nonce: number
  initCode: string
  callData: string
  callGasLimit: number
  verificationGasLimit: number
  preVerificationGas: number
  maxFeePerGas: number
  maxPriorityFeePerGas: number
  paymasterAndData: string
  signature: string
}

export type FallbackUserOperation = {
  sender: string
  target: string
  nonce: number
  callData: string
  callGasLimit: number
  dappIdentifier: string
  signature: string
}
export type FallbackApiResponse = {
  dappIdentifier: string
  signature: string
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Review
export const DEFAULT_FEE_RECEIVER = '0x7306aC7A32eb690232De81a9FFB44Bb346026faB'

export const GAS_USAGE_OFFSET = 4928 + 2360

// Few more constants can be added regarding token transfer / handle payments
export const FAKE_SIGNATURE =
  '0x39f5032f1cd30005aa1e35f04394cabfe7de3b6ae6d95b27edd8556064c287bf61f321fead0cf48ca4405d497cc8fc47fc7ff0b7f5c45baa14090a44f2307d8230'

export type RestRelayerOptions = {
  url: string
  socketServerUrl: string
}

export type FallbackRelayerOptions = {
  url: string
  relayerServiceUrl: string
  dappAPIKey: string
}

export type TokenData = {
  tokenGasPrice: number // review
  offset?: number // review
  symbol: string
  address: string
  decimal: number
  logoUrl: string
  feeTokenTransferGas: number
  refundReceiver?: string
}

export type FeeQuote = {
  symbol: string
  address: string
  decimal: number
  logoUrl: string
  payment: number
  tokenGasPrice: number
  offset?: number
  refundReceiver?: string
}

export type FeeOptionsResponse = {
  msg: string
  data: {
    chainId: number
    response: Array<TokenData>
  }
}
export type FeeOption = {
  feeToken: string
  tokenGasPrice: number | string //review
  offset: number | string // review
}
