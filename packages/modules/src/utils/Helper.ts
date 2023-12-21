import { UserOperationStruct } from "@alchemy/aa-core";
import { Hex, encodeAbiParameters, keccak256, parseAbiParameters } from "viem";

function packUserOp(op: Partial<UserOperationStruct>, forSignature = true): string {
  if (!op.initCode || !op.callData || !op.paymasterAndData) throw new Error("Missing userOp properties");
  if (forSignature) {
    return encodeAbiParameters(parseAbiParameters("address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"), [
      op.sender as Hex,
      BigInt(op.nonce as Hex),
      keccak256(op.initCode as Hex),
      keccak256(op.callData as Hex),
      BigInt(op.callGasLimit as Hex),
      BigInt(op.verificationGasLimit as Hex),
      BigInt(op.preVerificationGas as Hex),
      BigInt(op.maxFeePerGas as Hex),
      BigInt(op.maxPriorityFeePerGas as Hex),
      keccak256(op.paymasterAndData as Hex),
    ]);
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return encodeAbiParameters(parseAbiParameters("address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"), [
      op.sender as Hex,
      BigInt(op.nonce as Hex),
      op.initCode as Hex,
      op.callData as Hex,
      BigInt(op.callGasLimit as Hex),
      BigInt(op.verificationGasLimit as Hex),
      BigInt(op.preVerificationGas as Hex),
      BigInt(op.maxFeePerGas as Hex),
      BigInt(op.maxPriorityFeePerGas as Hex),
      op.paymasterAndData as Hex,
      op.signature as Hex,
    ]);
  }
}

export const getUserOpHash = (userOp: Partial<UserOperationStruct>, entryPointAddress: Hex, chainId: number): Hex => {
  const userOpHash = keccak256(packUserOp(userOp, true) as Hex);
  const enc = encodeAbiParameters(parseAbiParameters("bytes32, address, uint256"), [userOpHash, entryPointAddress, BigInt(chainId)]);
  return keccak256(enc);
};
