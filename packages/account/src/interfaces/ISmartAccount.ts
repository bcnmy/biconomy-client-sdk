import { UserOperation } from '@biconomy/core-types'
import { BigNumber, BigNumberish, Signer } from 'ethers'

export interface ISmartAccount {
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
    buildUserOp(updateNonce?: boolean): Promise<UserOperation>
    signUserOp(SmartAccountOrUserOperation?: UserOperation | this): Promise<UserOperation>
    sendUserOp(userOperation?: UserOperation): Promise<void>
}