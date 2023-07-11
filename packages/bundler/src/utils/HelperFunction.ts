import { UserOperation } from '@biconomy/core-types'
import { BigNumber, BigNumberish } from 'ethers'

export const transformUserOP = (userOp: UserOperation): UserOperation => {
  try {
    const userOperation: UserOperation = { ...userOp }
    const keys: (keyof UserOperation)[] = [
      'nonce',
      'callGasLimit',
      'verificationGasLimit',
      'preVerificationGas',
      'maxFeePerGas',
      'maxPriorityFeePerGas'
    ]
    for (const key of keys) {
      if (userOperation[key] && userOperation[key] !== '0') {
        (userOperation[key] as BigNumberish) = BigNumber.from(userOp[key]).toNumber()
      }
    }
    return userOperation
  } catch (error) {
    console.error(`Failed to transform user operation: ${error}`)
    throw error
  }
}
