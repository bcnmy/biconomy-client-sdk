import {
  type ByteArray,
  type Chain,
  type Hex,
  encodeAbiParameters,
  isHex,
  keccak256,
  pad,
  parseAbiParameters,
  toHex
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import {
  ERROR_MESSAGES,
  type UserOperationStruct,
  getChain
} from "../../account"
import type {
  ChainInfo,
  SignerData
  // createOwnableValidatorModule
} from "../../index.js"

/**
 * Rule
 *
 * https://docs.biconomy.io/modules/sessions/sessionvalidationmodule
 *
 * Rules define permissions for the args of an allowed method. With rules, you can precisely define what should be the args of the transaction that is allowed for a given Session. Every Rule works with a single static arg or a 32-byte chunk of the dynamic arg.
 * Since the ABI Encoding translates every static param into a 32-bytes word, even the shorter ones (like address or uint8), every Rule defines a desired relation (Condition) between n-th 32bytes word of the calldata and a reference Value (that is obviously a 32-bytes word as well).
 * So, when dApp is creating a _sessionKeyData to enable a session, it should convert every shorter static arg to a 32bytes word to match how it will be actually ABI encoded in the userOp.callData.
 * For the dynamic args, like bytes, every 32-bytes word of the calldata such as offset of the bytes arg, length of the bytes arg, and n-th 32-bytes word of the bytes arg can be controlled by a dedicated Rule.
 */
// export interface Rule {
//   /**
//    *
//    * offset
//    *
//    * https://docs.biconomy.io/modules/sessions/sessionvalidationmodule
//    *
//    * The offset in the ABI SVM contract helps locate the relevant data within the function call data, it serves as a reference point from which to start reading or extracting specific information required for validation. When processing function call data, particularly in low-level languages like Solidity assembly, it's necessary to locate where specific parameters or arguments are stored. The offset is used to calculate the starting position within the calldata where the desired data resides. Suppose we have a function call with multiple arguments passed as calldata. Each argument occupies a certain number of bytes, and the offset helps determine where each argument begins within the calldata.
//    * Using the offset to Extract Data: In the contract, the offset is used to calculate the position within the calldata where specific parameters or arguments are located. Since every arg is a 32-bytes word, offsets are always multiplier of 32 (or of 0x20 in hex).
//    * Let's see how the offset is applied to extract the to and value arguments of a transfer(address to, uint256 value) method:
//    * - Extracting to Argument: The to argument is the first parameter of the transfer function, representing the recipient address. Every calldata starts with the 4-bytes method selector. However, the ABI SVM is adding the selector length itself, so for the first argument the offset will always be 0 (0x00);
//    * - Extracting value Argument: The value argument is the second parameter of the transfer function, representing the amount of tokens to be transferred. To extract this argument, the offset for the value parameter would be calculated based on its position in the function calldata. Despite to is a 20-bytes address, in the solidity abi encoding it is always appended with zeroes to a 32-bytes word. So the offset for the second 32-bytes argument (which isthe value in our case) will be 32 (or 0x20 in hex).
//    *
//    * If you need to deal with dynamic-length arguments, such as bytes, please refer to this document https://docs.soliditylang.org/en/v0.8.24/abi-spec.html#function-selector-and-argument-encoding to learn more about how dynamic arguments are represented in the calldata and which offsets should be used to access them.
//    */
//   offset: number
//   /**
//    * condition
//    *
//    * 0 - Equal
//    * 1 - Less than or equal
//    * 2 - Less than
//    * 3 - Greater than or equal
//    * 4 - Greater than
//    * 5 - Not equal
//    */
//   condition: number
//   /** The value to compare against */
//   referenceValue:
//     | string
//     | number
//     | bigint
//     | boolean
//     | ByteArray
//     | HardcodedReference
// }

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

// export interface Permission {
//   /** The address of the contract to which the permission applies */
//   destContract: `0x${string}`
//   /** The function selector of the contract to which the permission applies */
//   functionSelector: `0x${string}`
//   /** The maximum value that can be transferred in a single transaction */
//   valueLimit: bigint
//   /** The rules that define the conditions under which the permission is granted */
//   rules: Rule[]
// }

function packUserOp(
  op: Partial<UserOperationStruct>,
  forSignature = true
): Hex {
  if (!op.callData) throw new Error("Missing userOp properties")
  if (forSignature) {
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"
      ),
      [
        op.sender ?? "0x",
        BigInt(op.nonce ?? 0n),
        keccak256(op.callData),
        BigInt(op.callGasLimit ?? 0n),
        BigInt(op.verificationGasLimit ?? 0n),
        BigInt(op.preVerificationGas ?? 0n),
        BigInt(op.maxFeePerGas ?? 0n),
        BigInt(op.maxPriorityFeePerGas ?? 0n),
        keccak256(op.paymasterAndData ?? "0x")
      ]
    )
  }
  // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
  return encodeAbiParameters(
    parseAbiParameters(
      "address, uint256, bytes, uint256, uint256, uint256, uint256, uint256, bytes"
    ),
    [
      op.sender ?? "0x",
      BigInt(op.nonce ?? 0n),
      keccak256(op.callData),
      BigInt(op.callGasLimit ?? 0n),
      BigInt(op.verificationGasLimit ?? 0n),
      BigInt(op.preVerificationGas ?? 0n),
      BigInt(op.maxFeePerGas ?? 0n),
      BigInt(op.maxPriorityFeePerGas ?? 0n),
      keccak256(op.paymasterAndData ?? "0x")
    ]
  )
}

export const getUserOpHash = (
  userOp: Partial<UserOperationStruct>,
  entryPointAddress: Hex,
  chainId: number
): Hex => {
  const userOpHash = keccak256(packUserOp(userOp, true))
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

export type HardcodedReference = {
  raw: Hex
}
type BaseReferenceValue = string | number | bigint | boolean | ByteArray
export type AnyReferenceValue = BaseReferenceValue | HardcodedReference
/**
 *
 * parseReferenceValue
 *
 * Parses the reference value to a hex string.
 * The reference value can be hardcoded using the {@link HardcodedReference} type.
 * Otherwise, it can be a string, number, bigint, boolean, or ByteArray.
 *
 * @param referenceValue {@link AnyReferenceValue}
 * @returns Hex
 */
export function parseReferenceValue(referenceValue: AnyReferenceValue): Hex {
  let result: Hex
  if ((referenceValue as HardcodedReference)?.raw) {
    result = (referenceValue as HardcodedReference)?.raw
  } else if (typeof referenceValue === "bigint") {
    result = pad(toHex(referenceValue), { size: 32 }) as Hex
  } else if (typeof referenceValue === "number") {
    result = pad(toHex(BigInt(referenceValue)), { size: 32 }) as Hex
  } else if (typeof referenceValue === "boolean") {
    result = pad(toHex(referenceValue), { size: 32 }) as Hex
  } else if (isHex(referenceValue)) {
    result = referenceValue
  } else if (typeof referenceValue === "string") {
    result = pad(referenceValue as Hex, { size: 32 })
  } else {
    // (typeof referenceValue === "object")
    result = pad(toHex(referenceValue as ByteArray), { size: 32 }) as Hex
  }
  if (!isHex(result) || result.length !== 66) {
    throw new Error(ERROR_MESSAGES.INVALID_HEX)
  }
  return result
}
