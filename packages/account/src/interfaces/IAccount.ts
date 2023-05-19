import { UserOperation  } from '@biconomy/core-types'
import { BigNumber, BigNumberish, Signer } from 'ethers'

export interface IAccount {
    resolveFields(op: Partial<UserOperation>): Promise<Partial<UserOperation>>
    estimateUserOpGas(): Promise<void>
    getPaymasterAndData(): Promise<void>
    useDefaults(partialOp: Partial<UserOperation>): Promise<this>
    nonce(): Promise<BigNumber>
    signUserOpHash(userOpHash: string, signer: Signer): Promise<string>
    getPreVerificationGas(userOp: Partial<UserOperation>): number
    getVerificationGasLimit(): Promise<BigNumberish>
    getUserOpHash(userOp: UserOperation): Promise<string>
    getAccountAddress(): string
    estimateCreationGas(): Promise<BigNumberish>
    buildUserOp(): Promise<UserOperation>
    signUserOp(): Promise<UserOperation>
    sendUserOp(): Promise<void>
}