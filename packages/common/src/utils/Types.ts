import { Address, Hex, SignableMessage, TypedData, TypedDataDefinition, WalletClient } from "viem";
import { Signer } from "@ethersproject/abstract-signer";

export type SupportedSignerName = "alchemy" | "ethers" | "viem";
export type SupportedSigner = SmartAccountSigner | WalletClient | Signer | LightSigner;

export type Service = "Bundler" | "Paymaster";

export interface LightSigner {
  getAddress(): Promise<string>;
  signMessage(message: string | Uint8Array): Promise<string>;
}

export type StateOverrideSet = {
  [key: string]: {
    balance?: string;
    nonce?: string;
    code?: string;
    state?: object;
    stateDiff?: object;
  };
};

export type BigNumberish = Hex | number | bigint;
export type BytesLike = Uint8Array | Hex;

//#region UserOperationStruct
// based on @account-abstraction/common
// this is used for building requests
export interface UserOperationStruct {
  /* the origin of the request */
  sender: string;
  /* nonce of the transaction, returned from the entry point for this Address */
  nonce: BigNumberish;
  /* the initCode for creating the sender if it does not exist yet, otherwise "0x" */
  initCode: BytesLike | "0x";
  /* the callData passed to the target */
  callData: BytesLike;
  /* Value used by inner account execution */
  callGasLimit?: BigNumberish;
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit?: BigNumberish;
  /* Gas overhead of this UserOperation */
  preVerificationGas?: BigNumberish;
  /* Maximum fee per gas (similar to EIP-1559 max_fee_per_gas) */
  maxFeePerGas?: BigNumberish;
  /* Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas) */
  maxPriorityFeePerGas?: BigNumberish;
  /* Address of paymaster sponsoring the transaction, followed by extra data to send to the paymaster ("0x" for self-sponsored transaction) */
  paymasterAndData: BytesLike | "0x";
  /* Data passed into the account along with the nonce during the verification step */
  signature: BytesLike;
}
//#endregion UserOperationStruct

//#region SmartAccountSigner
/**
 * A signer that can sign messages and typed data.
 *
 * @template Inner - the generic type of the inner client that the signer wraps to provide functionality such as signing, etc.
 *
 * @var signerType - the type of the signer (e.g. local, hardware, etc.)
 * @var inner - the inner client of @type {Inner}
 *
 * @method getAddress - get the address of the signer
 * @method signMessage - sign a message
 * @method signTypedData - sign typed data
 */
export interface SmartAccountSigner<Inner = any> {
  signerType: string;
  inner: Inner;

  getAddress: () => Promise<Address>;

  signMessage: (message: SignableMessage) => Promise<Hex>;

  signTypedData: <const TTypedData extends TypedData | { [key: string]: unknown }, TPrimaryType extends string = string>(
    params: TypedDataDefinition<TTypedData, TPrimaryType>,
  ) => Promise<Hex>;
}
//#endregion SmartAccountSigner
