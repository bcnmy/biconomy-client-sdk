import { ethers, BigNumber } from "ethers";
import { ChainId, UserOperation } from "@biconomy/core-types";

export type Bundlerconfig = {
  bundlerUrl: string;
  entryPointAddress?: string;
  chainId: ChainId;
  // eslint-disable-next-line no-unused-vars
  userOpReceiptIntervals?: { [key in ChainId]?: number };
};

export type UserOpReceipt = {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: number;
  paymaster: string;
  actualGasCost: BigNumber;
  actualGasUsed: BigNumber;
  success: boolean;
  reason: string;
  logs: Array<ethers.providers.Log>; // The logs generated by this UserOperation (not including logs of other UserOperations in the same bundle)
  receipt: ethers.providers.TransactionReceipt;
};

// review
export type UserOpStatus = {
  state: string; // for now // could be an enum
  transactionHash?: string;
  userOperationReceipt?: UserOpReceipt;
};

export type SendUserOpOptions = {
  simulationType?: SimulationType;
};

export type SimulationType = "validation" | "validation_and_execution";

// Converted to JsonRpcResponse with strict type
export type GetUserOperationReceiptResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpReceipt;
  error?: JsonRpcError;
};

export type GetUserOperationStatusResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpStatus;
  error?: JsonRpcError;
};

// Converted to JsonRpcResponse with strict type
export type SendUserOpResponse = {
  jsonrpc: string;
  id: number;
  result: string;
  error?: JsonRpcError;
};

export type UserOpResponse = {
  userOpHash: string;
  wait(_confirmations?: number): Promise<UserOpReceipt>;
  waitForTxHash?(): Promise<UserOpStatus>;
};

// Converted to JsonRpcResponse with strict type
export type EstimateUserOpGasResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpGasResponse;
  error?: JsonRpcError;
};

export type UserOpGasResponse = {
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

// Converted to JsonRpcResponse with strict type
export type GetUserOpByHashResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpByHashResponse;
  error?: JsonRpcError;
};

export type UserOpByHashResponse = UserOperation & {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  entryPoint: string;
};
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcError = {
  code: string;
  message: string;
  data: any;
};

export type GetGasFeeValuesResponse = {
  jsonrpc: string;
  id: number;
  result: GasFeeValues;
  error?: JsonRpcError;
};
export type GasFeeValues = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};
