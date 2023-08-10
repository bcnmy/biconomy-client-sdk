import { UserOperation } from '@biconomy/core-types'
import { UserOpResponse } from '@biconomy/bundler'
import { BigNumberish, Bytes, BytesLike, BigNumber } from 'ethers'

/**
 *
 */
export interface IBaseSmartAccount {
  getVerificationGasLimit(initCode: BytesLike): Promise<BigNumberish>
  getPreVerificationGas(userOp: Partial<UserOperation>): Promise<BigNumberish>
  estimateCreationGas(initCode: string): Promise<BigNumberish>
  signUserOp(userOperation: UserOperation): Promise<UserOperation>
  signUserOpHash(userOpHash: string): Promise<string>
  getNonce(): Promise<BigNumber>
  getUserOpHash(userOp: Partial<UserOperation>): Promise<string>
  signMessage(message: Bytes | string): Promise<string>

  getSmartAccountAddress(accountIndex?: number): Promise<string>

  // Review: consider adding
  // TODO
  // getAccountInitCode(): Promise<string>

  // Review: conside adding
  // encodeUserOpCallDataAndGasLimit() (Refer to notes in BiconomySmartAccountV1)
}
