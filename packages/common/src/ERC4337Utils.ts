import { defaultAbiCoder, hexConcat, hexlify, keccak256 } from 'ethers/lib/utils'
import { ethers } from 'ethers'
import Debug from 'debug'
import { ChainId, UserOperation } from '@biconomy-devx/core-types'

const debug = Debug('aa.utils')

export const AddressZero = ethers.constants.AddressZero

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]

// reverse "Deferrable" or "PromiseOrValue" fields
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type NotPromise<T> = {
  [P in keyof T]: Exclude<T[P], Promise<any>>
}

// function encode(typevalues: Array<{ type: string; val: any }>, forSignature: boolean): string {
//   const types = typevalues.map((typevalue) =>
//     typevalue.type === 'bytes' && forSignature ? 'bytes32' : typevalue.type
//   )
//   const values = typevalues.map((typevalue) =>
//     typevalue.type === 'bytes' && forSignature ? keccak256(typevalue.val) : typevalue.val
//   )
//   return defaultAbiCoder.encode(types, values)
// }

/**
 * pack the userOperation
 * @param op
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export function packUserOp(op: Partial<UserOperation>, forSignature = true): string {
  if (!op.initCode || !op.callData || !op.paymasterAndData)
    throw new Error('Missing userOp properties')

  if (forSignature) {
    return defaultAbiCoder.encode(
      [
        'address',
        'uint256',
        'bytes32',
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes32'
      ],
      [
        op.sender,
        op.nonce,
        keccak256(op.initCode),
        keccak256(op.callData),
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData)
      ]
    )
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return defaultAbiCoder.encode(
      [
        'address',
        'uint256',
        'bytes',
        'bytes',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes',
        'bytes'
      ],
      [
        op.sender,
        op.nonce,
        op.initCode,
        op.callData,
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        op.paymasterAndData,
        op.signature
      ]
    )
  }
}

/**
 * calculate the userOpHash of a given userOperation.
 * The userOpHash is a hash of all UserOperation fields, except the "signature" field.
 * The entryPoint uses this value in the emitted UserOperationEvent.
 * A wallet may use this value as the hash to sign (the SampleWallet uses this method)
 * @param op
 * @param entryPoint
 * @param chainId
 */
export function getUserOpHash(
  op: Partial<UserOperation>,
  entryPoint: string,
  chainId: number
): string {
  const userOpHash = keccak256(packUserOp(op, true))
  const enc = defaultAbiCoder.encode(
    ['bytes32', 'address', 'uint256'],
    [userOpHash, entryPoint, chainId]
  )
  return keccak256(enc)
}

const ErrorSig = keccak256(Buffer.from('Error(string)')).slice(0, 10) // 0x08c379a0
const FailedOpSig = keccak256(Buffer.from('FailedOp(uint256,address,string)')).slice(0, 10) // 0x00fa072b

interface DecodedError {
  message: string
  opIndex?: number
  paymaster?: string
}

/**
 * decode bytes thrown by revert as Error(message) or FailedOp(opIndex,paymaster,message)
 */
export function decodeErrorReason(error: string): DecodedError | undefined {
  debug('decoding', error)
  if (error.startsWith(ErrorSig)) {
    const [message] = defaultAbiCoder.decode(['string'], '0x' + error.substring(10))
    return { message }
  } else if (error.startsWith(FailedOpSig)) {
    const resultSet = defaultAbiCoder.decode(
      ['uint256', 'address', 'string'],
      '0x' + error.substring(10)
    )
    let [paymaster, message] = resultSet
    const [opIndex] = resultSet
    message = `FailedOp: ${message as string}`
    if (paymaster.toString() !== ethers.constants.AddressZero) {
      message = `${message as string} (paymaster ${paymaster as string})`
    } else {
      paymaster = undefined
    }
    return {
      message,
      opIndex,
      paymaster
    }
  }
  return undefined
}

/**
 * update thrown Error object with our custom FailedOp message, and re-throw it.
 * updated both "message" and inner encoded "data"
 * tested on geth, hardhat-node
 * usage: entryPoint.handleOps().catch(decodeError)
 */
export function rethrowError(e: any): any {
  let error = e
  let parent = e
  if (error?.error != null) {
    error = error.error
  }
  while (error?.data != null) {
    parent = error
    error = error.data
  }
  const decoded =
    typeof error === 'string' && error.length > 2 ? decodeErrorReason(error) : undefined
  if (decoded != null) {
    e.message = decoded.message

    if (decoded.opIndex != null) {
      // helper for chai: convert our FailedOp error into "Error(msg)"
      const errorWithMsg = hexConcat([
        ErrorSig,
        defaultAbiCoder.encode(['string'], [decoded.message])
      ])
      // modify in-place the error object:
      parent.data = errorWithMsg
    }
  }
  throw e
}

/**
 * hexlify all members of object, recursively
 * @param obj
 */
export function deepHexlify(obj: any): any {
  if (typeof obj === 'function') {
    return undefined
  }
  if (obj == null || typeof obj === 'string' || typeof obj === 'boolean') {
    return obj
  } else if (obj._isBigNumber != null || typeof obj !== 'object') {
    return hexlify(obj).replace(/^0x0/, '0x')
  }
  if (Array.isArray(obj)) {
    return obj.map((member) => deepHexlify(member))
  }
  return Object.keys(obj).reduce(
    (set, key) => ({
      ...set,
      [key]: deepHexlify(obj[key])
    }),
    {}
  )
}
