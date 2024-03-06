import { UserOperationStruct } from "@alchemy/aa-core";
import { Hex, encodeAbiParameters, keccak256, parseAbiParameters, concat, pad, toHex } from "viem";

export interface Rule {
  offset: number;
  condition: number;
  referenceValue: `0x${string}`;
}

export interface Permission {
  destContract: `0x${string}`;
  functionSelector: `0x${string}`;
  valueLimit: bigint;
  rules: Rule[];
}

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

export async function getABISVMSessionKeyData(sessionKey: `0x${string}` | Uint8Array, permission: Permission): Promise<`0x${string}` | Uint8Array> {
  let sessionKeyData = concat([
    sessionKey,
    permission.destContract,
    permission.functionSelector,
    pad(toHex(permission.valueLimit), { size: 16 }),
    pad(toHex(permission.rules.length), { size: 2 }), // this can't be more 2**11 (see below), so uint16 (2 bytes) is enough
  ]) as `0x${string}`;

  for (let i = 0; i < permission.rules.length; i++) {
    sessionKeyData = concat([
      sessionKeyData,
      pad(toHex(permission.rules[i].offset), { size: 2 }), // offset is uint16, so there can't be more than 2**16/32 args = 2**11
      pad(toHex(permission.rules[i].condition), { size: 1 }), // uint8
      permission.rules[i].referenceValue,
    ]);
  }
  return sessionKeyData;
}
