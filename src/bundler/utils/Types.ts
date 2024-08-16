import { ParamType } from "ethers"
import type { Address, Chain, Hash, Hex, Log } from "viem"
import type { UserOperationStruct } from "../../account"

export type BundlerConfig = {
  bundlerUrl: string
  entryPointAddress?: string
  chain: Chain
  // eslint-disable-next-line no-unused-vars
  userOpReceiptIntervals?: { [key in number]?: number }
  userOpWaitForTxHashIntervals?: { [key in number]?: number }
  userOpReceiptMaxDurationIntervals?: { [key in number]?: number }
  userOpWaitForTxHashMaxDurationIntervals?: { [key in number]?: number }
}
export type BundlerConfigWithChainId = BundlerConfig & { chainId: number }

export type TStatus = "success" | "reverted"

export type UserOpReceiptTransaction = {
  transactionHash: Hex
  transactionIndex: bigint
  blockHash: Hash
  blockNumber: bigint
  from: Address
  to: Address | null
  cumulativeGasUsed: bigint
  status: TStatus
  gasUsed: bigint
  contractAddress: Address | null
  logsBloom: Hex
  effectiveGasPrice: bigint
}

export type UserOpReceipt = {
  userOpHash: Hash
  entryPoint: Address
  sender: Address
  nonce: bigint
  paymaster?: Address
  actualGasUsed: bigint
  actualGasCost: bigint
  success: boolean
  reason?: string
  receipt: UserOpReceiptTransaction
  logs: Log[]
}

// review
export type UserOpStatus = {
  state: string // for now // could be an enum
  transactionHash?: string
  userOperationReceipt?: UserOpReceipt
}

// Converted to JsonRpcResponse with strict type
export type GetUserOperationReceiptResponse = {
  jsonrpc: string
  id: number
  result: UserOpReceipt
  error?: JsonRpcError
}

export type GetUserOperationStatusResponse = {
  jsonrpc: string
  id: number
  result: UserOpStatus
  error?: JsonRpcError
}

// Converted to JsonRpcResponse with strict type
export type SendUserOpResponse = {
  jsonrpc: string
  id: number
  result: string
  error?: JsonRpcError
}

export type UserOpResponse = {
  userOpHash: Hash
  wait(_confirmations?: number): Promise<UserOpReceipt>
}

// Converted to JsonRpcResponse with strict type
export type EstimateUserOpGasResponse = {
  jsonrpc: string
  id: number
  result: UserOpGasResponse
  error?: JsonRpcError
}

export type UserOpGasResponse = {
  preVerificationGas: bigint
  verificationGasLimit: bigint
  callGasLimit: bigint
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
}

// Converted to JsonRpcResponse with strict type
export type GetUserOpByHashResponse = {
  jsonrpc: string
  id: number
  result: UserOpByHashResponse
  error?: JsonRpcError
}

export type UserOpByHashResponse = UserOperationStruct & {
  transactionHash: string
  blockNumber: number
  blockHash: string
  entryPoint: string
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcError = {
  code: string
  message: string
  data: any
}

export type GetGasFeeValuesResponse = {
  jsonrpc: string
  id: number
  result: GasFeeValues
  error?: JsonRpcError
}
export type GasFeeValues = {
  maxPriorityFeePerGas: bigint
  maxFeePerGas: bigint
}

export type GetUserOperationGasPriceReturnType = {
  slow: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
  standard: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
  fast: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
}

export type BundlerEstimateUserOpGasResponse = {
  preVerificationGas: Hex
  verificationGasLimit: Hex
  callGasLimit?: Hex | null
  paymasterVerificationGasLimit?: Hex | null
  paymasterPostOpGasLimit?: Hex | null
}

// define mode and exec type enums
export const CALLTYPE_SINGLE = "0x00" // 1 byte
export const CALLTYPE_BATCH = "0x01" // 1 byte
export const EXECTYPE_DEFAULT = "0x00" // 1 byte
export const EXECTYPE_TRY = "0x01" // 1 byte
export const EXECTYPE_DELEGATE = "0xFF" // 1 byte
export const MODE_DEFAULT = "0x00000000" // 4 bytes
export const UNUSED = "0x00000000" // 4 bytes
export const MODE_PAYLOAD = "0x00000000000000000000000000000000000000000000" // 22 bytes
export const ERC1271_MAGICVALUE = "0x1626ba7e"
export const ERC1271_INVALID = "0xffffffff"

export const GENERIC_FALLBACK_SELECTOR = "0xcb5baf0f"

export const Executions = ParamType.from({
  type: "tuple(address,uint256,bytes)[]",
  baseType: "tuple",
  name: "executions",
  arrayLength: null,
  components: [
    { name: "target", type: "address" },
    { name: "value", type: "uint256" },
    { name: "callData", type: "bytes" }
  ]
})
