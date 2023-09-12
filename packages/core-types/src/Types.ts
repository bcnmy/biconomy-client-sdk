import { BigNumberish, BytesLike } from "ethers";

export type SmartAccountVersion = "1.0.1" | "1.0.0" | "1.0.2";

export type Transaction = {
  to: string;
  value?: BigNumberish;
  data?: string;
};

export type UserOperation = {
  sender: string;
  nonce: BigNumberish;
  initCode: BytesLike;
  callData: BytesLike;
  callGasLimit: BigNumberish;
  verificationGasLimit: BigNumberish;
  preVerificationGas: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  paymasterAndData: BytesLike;
  signature: BytesLike;
};

export enum SmartAccountType {
  BICONOMY,
}
