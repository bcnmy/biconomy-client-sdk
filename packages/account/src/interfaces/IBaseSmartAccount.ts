import { UserOperation } from '@biconomy/core-types'
import { UserOpResponse } from '@biconomy/bundler'
import { BigNumberish, Bytes, BytesLike, BigNumber } from 'ethers'
/**
 * Interface for Smart Contract Wallet aka Smart Account.
 * This SA does not have to implement ERC4337 interfaces
 */
export interface INon4337Account {
  estimateCreationGas(initCode: string): Promise<BigNumberish>
  getNonce(): Promise<BigNumber>
  signMessage(message: Bytes | string): Promise<string>
  getAccountAddress(accountIndex?: number): Promise<string>
}

export interface IBaseSmartAccount extends INon4337Account {
  getVerificationGasLimit(initCode: BytesLike): Promise<BigNumberish>
  getPreVerificationGas(userOp: Partial<UserOperation>): Promise<BigNumberish>
  signUserOp(userOp: UserOperation): Promise<UserOperation>
  signUserOpHash(userOpHash: string): Promise<string>
  getUserOpHash(userOp: Partial<UserOperation>): Promise<string>
  getAccountInitCode(): Promise<string>

  // sendUserOp(userOp: UserOperation): Promise<UserOpResponse>
  // sendSignedUserOp(userOp: UserOperation): Promise<UserOpResponse>

  // Review: conside adding
  // encodeUserOpCallDataAndGasLimit() (Refer to notes in BiconomySmartAccountV1)
}
