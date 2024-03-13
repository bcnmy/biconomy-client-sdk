import { BigNumberish } from "@alchemy/aa-core";
export type Hex = `0x${string}`;

export type PaymasterServiceErrorResponse = {
  jsonrpc: string;
  id: number;
  error: JsonRpcError;
};

export type JsonRpcResponse = {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: JsonRpcError;
};

export type JsonRpcError = {
  code: string;
  message: string;
  data: any;
};

export type PaymasterConfig = {
  /** Read about at https://docs.biconomy.io/dashboard/paymaster */
  paymasterUrl: string;
  /** Whether or not to enforce abiding by the paymaster policies */
  strictMode?: boolean;
};

export type SponsorUserOperationDto = {
  /** mode: sponsored or erc20 */
  mode: PaymasterMode;
  /** Always recommended, especially when using token paymaster */
  calculateGasLimits?: boolean;
  /** Expiry duration in seconds */
  expiryDuration?: number;
  /** Webhooks to be fired after user op is sent */
  webhookData?: Record<string, any>;
  /** Smart account meta data */
  smartAccountInfo?: SmartAccountData;
  /** the fee-paying token address */
  feeTokenAddress?: string;
};

export type FeeQuotesOrDataDto = {
  /** mode: sponsored or erc20 */
  mode?: PaymasterMode;
  /** Expiry duration in seconds */
  expiryDuration?: number;
  /** Always recommended, especially when using token paymaster */
  calculateGasLimits?: boolean;
  /** List of tokens to be used for fee quotes, if ommitted fees for all supported will be returned */
  tokenList?: string[];
  /** preferredToken: Can be ommitted to return all quotes */
  preferredToken?: string;
  /** Webhooks to be fired after user op is sent */
  webhookData?: Record<string, any>;
  /** Smart account meta data */
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
  /** Webhooks to be fired after user op is sent */
  webhookData?: Record<string, any>;
  /** Smart account meta data */
  smartAccountInfo: SmartAccountData;
};

export type SmartAccountData = {
  /** name: Name of the smart account */
  name: string;
  /** version: Version of the smart account */
  version: string;
};

export type PaymasterFeeQuote = {
  /** symbol: Token symbol */
  symbol: string;
  /** tokenAddress: Token address */
  tokenAddress: string;
  /** decimal: Token decimal */
  decimal: number;
  logoUrl?: string;
  /** maxGasFee: in wei */
  maxGasFee: number;
  /** maxGasFee: in dollars */
  maxGasFeeUSD?: number;
  usdPayment?: number;
  /** The premium paid on the token */
  premiumPercentage: number;
  /** validUntil: Unix timestamp */
  validUntil?: number;
};

export type BiconomyTokenPaymasterRequest = {
  /** The feeQuote to be used for the transaction */
  feeQuote: PaymasterFeeQuote;
  /** The address of the spender. This is usually set to {@link FeeQuotesOrDataResponse.tokenPaymasterAddress}  */
  spender: Hex;
  /** Not recommended */
  maxApproval?: boolean;
  /* skip option to patch callData if approval is already given to the paymaster */
  skipPatchCallData?: boolean;
};

export type FeeQuotesOrDataResponse = {
  /** Array of results from the paymaster */
  feeQuotes?: PaymasterFeeQuote[];
  /** Normally set to the spender in the proceeding call to send the tx */
  tokenPaymasterAddress?: Hex;
  /** Relevant Data returned from the paymaster */
  paymasterAndData?: Uint8Array | Hex;
  /* Gas overhead of this UserOperation */
  preVerificationGas?: BigNumberish;
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit?: BigNumberish;
  /* Value used by inner account execution */
  callGasLimit?: BigNumberish;
};

export type PaymasterAndDataResponse = {
  paymasterAndData: Hex;
  /* Gas overhead of this UserOperation */
  preVerificationGas: number;
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit: number;
  /* Value used by inner account execution */
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
  /* Gas overhead of this UserOperation */
  preVerificationGas: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit: string;
  callGasLimit: string;
};

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

type ValueOrData = RequireAtLeastOne<
  {
    value: BigNumberish | string;
    data: string;
  },
  "value" | "data"
>;
export type Transaction = {
  to: string;
} & ValueOrData;
