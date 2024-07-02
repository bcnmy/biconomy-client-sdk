import { type Hex } from "viem"
import type { BigNumberish, UserOperationStruct } from "../../account"

// Will convert the userOp hex, bigInt and number values to hex strings
export const transformUserOP = (
  userOp: UserOperationStruct
): UserOperationStruct => {
  try {
    const userOperation = { ...userOp }
    const keys: (keyof UserOperationStruct)[] = [
      "nonce",
      "callGasLimit",
      "verificationGasLimit",
      "preVerificationGas",
      "maxFeePerGas",
      "maxPriorityFeePerGas"
    ]
    for (const key of keys) {
      if (userOperation[key] && userOperation[key] !== "0x") {
        userOperation[key] = `0x${BigInt(userOp[key] as BigNumberish).toString(
          16
        )}` as Hex
      }
    }
    return userOperation
  } catch (error) {
    throw `Failed to transform user operation: ${error}`
  }
}

/**
 * @description this function will return current timestamp in seconds
 * @returns Number
 */
export const getTimestampInSeconds = (): number => {
  return Math.floor(Date.now() / 1000)
}
