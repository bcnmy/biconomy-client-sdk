import { BigNumberish } from "@alchemy/aa-core";
export type Hex = `0x${string}`;

export type PaymasterServiceErrorResponse = {
  jsonrpc: string;
  id: number;
  error: JsonRpcError;
};

// Generic
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcResponse = {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: JsonRpcError;
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcError = {
  code: string;
  message: string;
  data: any;
};

export type PaymasterConfig = {
  paymasterUrl: string;
  strictMode?: boolean;
};

export type SponsorUserOperationDto = {
  mode: PaymasterMode;
  calculateGasLimits?: boolean;
  expiryDuration?: number;
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  smartAccountInfo?: SmartAccountData;
  feeTokenAddress?: string;
};

export type FeeQuotesOrDataDto = {
  mode?: PaymasterMode;
  expiryDuration?: number;
  calculateGasLimits?: boolean;
  tokenList?: string[];
  preferredToken?: string;
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  smartAccountInfo?: SmartAccountData;
};

export type FeeQuoteParams = {
  tokenList?: string[];
  preferredToken?: string;
};

export type FeeTokenInfo = {
  feeTokenAddress: string;
};

export type SponsorpshipInfo = {
  webhookData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  smartAccountInfo: SmartAccountData;
};

export type SmartAccountData = {
  name: string;
  version: string;
};

export type PaymasterFeeQuote = {
  symbol: string;
  tokenAddress: string;
  decimal: number;
  logoUrl?: string;
  maxGasFee: number;
  maxGasFeeUSD?: number;
  usdPayment?: number;
  premiumPercentage: number;
  validUntil?: number;
};

export type BiconomyTokenPaymasterRequest = {
  feeQuote: PaymasterFeeQuote;
  spender: Hex;
  maxApproval?: boolean;
};

export type FeeQuotesOrDataResponse = {
  feeQuotes?: PaymasterFeeQuote[];
  tokenPaymasterAddress?: Hex; 
  paymasterAndData?: Uint8Array| Hex;
  preVerificationGas?: BigNumberish;
  verificationGasLimit?: BigNumberish;
  callGasLimit?: BigNumberish;
};

export type PaymasterAndDataResponse = {
  paymasterAndData: Hex;
  preVerificationGas: number;
  verificationGasLimit: number;
  callGasLimit: number;
};

export enum PaymasterMode {
  ERC20 = "ERC20",
  SPONSORED = "SPONSORED",
}

// Converted to JsonRpcResponse with strict type
export type EstimateUserOpGasResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpGasResponse;
  error?: JsonRpcError;
};

export type UserOpGasResponse = {
  paymasterAndData: string;
  preVerificationGas: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
};

export type Transaction = {
  to: string;
  value: BigNumberish;
  data: string;
};
