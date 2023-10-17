// import type { Address } from "viem";
export type Hex = `0x${string}`;
export type EmptyHex = `0x`;
// based on @account-abstraction/common
export type BigNumberish = string | bigint | number;
export type BytesLike = Uint8Array | string;

export type SmartAccountVersion = "1.0.1" | "1.0.0" | "1.0.2";

export type Transaction = {
  to: string;
  value?: BigNumberish;
  data?: string;
};

export type UserOperation = {
  /* the origin of the request */
  sender: Hex; // TODO: Address
  /* nonce (as hex) of the transaction, returned from the entrypoint for this Address */
  nonce: Hex;
  /* the initCode for creating the sender if it does not exist yet, otherwise "0x" */
  initCode: Hex | EmptyHex;
  /* the callData passed to the target */
  callData: Hex;
  /* Gas value (as hex) used by inner account execution */
  callGasLimit: Hex;
  /* Actual gas (as hex) used by the validation of this UserOperation */
  verificationGasLimit: Hex;
  /* Gas overhead (as hex) of this UserOperation */
  preVerificationGas: Hex;
  /* Maximum fee per gas (similar to EIP-1559 max_fee_per_gas) (as hex)*/
  maxFeePerGas: Hex;
  /* Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas) (as hex)*/
  maxPriorityFeePerGas: Hex;
  /* Address of paymaster sponsoring the transaction, followed by extra data to send to the paymaster ("0x" for self-sponsored transaction) */
  paymasterAndData: Hex | EmptyHex;
  /* Data passed into the account along with the nonce during the verification step */
  signature: Hex;
};

export enum SmartAccountType {
  BICONOMY,
}
