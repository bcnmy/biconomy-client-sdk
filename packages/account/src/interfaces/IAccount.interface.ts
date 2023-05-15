import { ChainId,UserOperation  } from '@biconomy/core-types'
import { BigNumber, BigNumberish, Signer } from 'ethers'

export interface IAccount {
    nonce(): Promise<BigNumber>
    signUserOpHash(userOpHash: string, signer: Signer): Promise<string>
    getPreVerificationGas(userOp: Partial<UserOperation>): number
    getVerificationGasLimit(): Promise<BigNumberish>
    getUserOpHash(userOp: UserOperation): Promise<string>
    getAccountAddress(): string
    estimateCreationGas(): Promise<BigNumberish>
}