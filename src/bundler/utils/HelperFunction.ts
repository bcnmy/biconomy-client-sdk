// Will convert the userOp hex, bigInt and number values to hex strings
// export const transformUserOP = (
//   userOp: UserOperationStruct
// ): UserOperationStruct => {
//   try {
//     const userOperation = { ...userOp }
//     const keys: (keyof UserOperationStruct)[] = [
//       "nonce",
//       "callGasLimit",
//       "verificationGasLimit",
//       "preVerificationGas",
//       "maxFeePerGas",
//       "maxPriorityFeePerGas"
//     ]
//     for (const key of keys) {
//       if (userOperation[key] && userOperation[key] !== "0x") {
//         userOperation[key] = `0x${BigInt(userOp[key] as BigNumberish).toString(
//           16
//         )}` as `0x${string}`
//       }
//     }
//     return userOperation
//   } catch (error) {
//     throw `Failed to transform user operation: ${error}`
//   }
// }

/**
 * @description this function will return current timestamp in seconds
 * @returns Number
 */
export const getTimestampInSeconds = (): number => {
  return Math.floor(Date.now() / 1000)
}

export function decodeUserOperationError(errorFromBundler: string) {
  const prefix = "UserOperation reverted during simulation with reason: "
  if (errorFromBundler.includes(prefix)) {
    const errorCode = errorFromBundler
      .slice(prefix.length)
      .trim()
      .replace(/"/g, "")
    return decodeErrorCode(errorCode)
  }
  return errorFromBundler // Return original error if it doesn't match the expected format
}

function decodeErrorCode(errorCode: string) {
  const errorMap: { [key: string]: string } = {
    "0xe7190273":
      "NotSortedAndUnique: The owners array must contain unique addresses.",
    "0xf91bd6f1000000000000000000000000da6959da394b1bddb068923a9a214dc0cd193d2e":
      "NotInitialized: The module is not initialized on this smart account.",
    "0xaabd5a09":
      "InvalidThreshold: The threshold must be greater than or equal to the number of owners.",
    "0x71448bfe000000000000000000000000bf2137a23f439ca5aa4360cc6970d70b24d07ea2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0":
      "WrongContractSignatureFormat",
    "0x40d3d1a40000000000000000000000004d8249d21c9553b1bd23cabf611011376dd3416a":
      "LinkedList_EntryAlreadyInList",
    "0x40d3d1a40000000000000000000000004b8306128aed3d49a9d17b99bf8082d4e406fa1f":
      "LinkedList_EntryAlreadyInList",
    "0x40d3d1a4000000000000000000000000d98238bbaea4f91683d250003799ead31d7f5c55":
      "Error: Custom error message about the K1Validator contract"
    // Add more error codes and their corresponding human-readable messages here
  }
  const decodedError = errorMap[errorCode] || errorCode
  return `User operation reverted during simulation with reason: ${decodedError}`
}
