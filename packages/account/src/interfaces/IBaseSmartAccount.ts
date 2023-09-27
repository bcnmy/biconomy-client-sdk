import { UserOperation } from "@biconomy/core-types";
import { BigNumberish, Bytes, BytesLike, BigNumber } from "ethers";
/**
 * Interface for Smart Contract Wallet aka Smart Account.
 * This SA does not have to implement ERC4337 interfaces
 */
export interface INon4337Account {
  estimateCreationGas(_initCode: string): Promise<BigNumberish>;
  getNonce(): Promise<BigNumber>;
  signMessage(_message: Bytes | string): Promise<string>;
  getAccountAddress(_accountIndex?: number): Promise<string>;
}

export interface IBaseSmartAccount extends INon4337Account {
  getVerificationGasLimit(_initCode: BytesLike): Promise<BigNumberish>;
  getPreVerificationGas(_userOp: Partial<UserOperation>): Promise<BigNumberish>;
  signUserOp(_userOp: UserOperation): Promise<UserOperation>;
  signUserOpHash(_userOpHash: string): Promise<string>;
  getUserOpHash(_userOp: Partial<UserOperation>): Promise<string>;
  getAccountInitCode(): Promise<string>;
  getDummySignature(): Promise<string>;
}
