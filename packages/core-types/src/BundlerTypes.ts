export type UserOpGasFields = {
  maxPriorityFeePerGas: string | null;
  maxFeePerGas: string | null;
  gasPrice: string | null;
  callGasLimit: number;
  verificationGasLimit: number;
  preVerificationGas: number;
};
