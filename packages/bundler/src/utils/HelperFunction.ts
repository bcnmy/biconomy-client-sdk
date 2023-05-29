import { UserOperation, ChainId } from '@biconomy/core-types'
import { BigNumber } from 'ethers'

export const transformUserOP = (userOp: UserOperation): UserOperation => {
    const userOperation = {...userOp}
    userOperation.nonce = BigNumber.from(userOp.nonce).toHexString() ?? userOp.nonce
    userOperation.callGasLimit = BigNumber.from(userOp.callGasLimit).toHexString() ?? userOp.nonce
    userOperation.verificationGasLimit = BigNumber.from(userOp.verificationGasLimit).toHexString() ?? userOp.nonce
    userOperation.preVerificationGas = BigNumber.from(userOp.preVerificationGas).toHexString() ?? userOp.nonce
    userOperation.maxFeePerGas = BigNumber.from(userOp.maxFeePerGas).toHexString() ?? userOp.nonce
    userOperation.maxPriorityFeePerGas = BigNumber.from(userOp.maxPriorityFeePerGas).toHexString() ?? userOp.nonce
    return userOperation
}