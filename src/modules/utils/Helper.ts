import {
  type ByteArray,
  type Chain,
  type Hex,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import type { ChainInfo, SignerData } from "../.."
import { type UserOperationStruct, getChain } from "../../account"

export interface Rule {
  /** The index of the param from the selected contract function upon which the condition will be applied */
  offset: number
  /**
   * Conditions:
   *
   * 0 - Equal
   * 1 - Less than or equal
   * 2 - Less than
   * 3 - Greater than or equal
   * 4 - Greater than
   * 5 - Not equal
   */
  condition: number
  /** The value to compare against */
  referenceValue: string | number | bigint | boolean | ByteArray
}

/**
 * @deprecated
 */
export interface DeprecatedRule {
  offset: number
  condition: number
  referenceValue: Hex
}
/**
 * @deprecated
 */
export interface DeprecatedPermission {
  destContract: `0x${string}`
  functionSelector: `0x${string}`
  valueLimit: bigint
  rules: DeprecatedRule[]
}

export interface Permission {
  /** The address of the contract to which the permission applies */
  destContract: `0x${string}`
  /** The function selector of the contract to which the permission applies */
  functionSelector: `0x${string}`
  /** The maximum value that can be transferred in a single transaction */
  valueLimit: bigint
  /** The rules that define the conditions under which the permission is granted */
  rules: Rule[]
}

function packUserOp(
  op: Partial<UserOperationStruct>,
  forSignature = true
): string {
  if (!op.initCode || !op.callData || !op.paymasterAndData)
    throw new Error("Missing userOp properties")
  if (forSignature) {
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"
      ),
      [
        op.sender as Hex,
        BigInt(op.nonce as Hex),
        keccak256(op.initCode as Hex),
        keccak256(op.callData as Hex),
        BigInt(op.callGasLimit as Hex),
        BigInt(op.verificationGasLimit as Hex),
        BigInt(op.preVerificationGas as Hex),
        BigInt(op.maxFeePerGas as Hex),
        BigInt(op.maxPriorityFeePerGas as Hex),
        keccak256(op.paymasterAndData as Hex)
      ]
    )
  }
  // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
  return encodeAbiParameters(
    parseAbiParameters(
      "address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"
    ),
    [
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
      op.signature as Hex
    ]
  )
}

export const getUserOpHash = (
  userOp: Partial<UserOperationStruct>,
  entryPointAddress: Hex,
  chainId: number
): Hex => {
  const userOpHash = keccak256(packUserOp(userOp, true) as Hex)
  const enc = encodeAbiParameters(
    parseAbiParameters("bytes32, address, uint256"),
    [userOpHash, entryPointAddress, BigInt(chainId)]
  )
  return keccak256(enc)
}

export const getRandomSigner = (): SignerData => {
  const pkey = generatePrivateKey()
  const account = privateKeyToAccount(pkey)
  return {
    pvKey: pkey,
    pbKey: account.address
  }
}

export const parseChain = (chainInfo: ChainInfo): Chain => {
  if (typeof chainInfo === "number") return getChain(chainInfo)
  return chainInfo
}
