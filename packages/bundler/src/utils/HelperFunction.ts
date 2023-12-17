import { type UserOperationStruct } from "@alchemy/aa-core";
import { BigNumber } from "ethers";

export const transformUserOP = (userOp: UserOperationStruct): UserOperationStruct => {
  try {
    const userOperation = { ...userOp };
    const keys: (keyof UserOperationStruct)[] = [
      "nonce",
      "callGasLimit",
      "verificationGasLimit",
      "preVerificationGas",
      "maxFeePerGas",
      "maxPriorityFeePerGas",
    ];
    for (const key of keys) {
      if (userOperation[key] && userOperation[key] !== "0x") {
        userOperation[key] = BigNumber.from(userOp[key]).toHexString() as `0x${string}`;
      }
    }
    return userOperation;
  } catch (error) {
    throw `Failed to transform user operation: ${error}`;
  }
};
