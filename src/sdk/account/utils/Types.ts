import type { Address, Hash, Hex, Log } from "viem"
import type { MODE_MODULE_ENABLE, MODE_VALIDATION } from "./Constants"

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

export type NonceOptions = {
  /** nonceKey: The key to use for nonce */
  nonceKey?: bigint
  /** validationMode: Mode of the validation module */
  validationMode?: typeof MODE_VALIDATION | typeof MODE_MODULE_ENABLE
  /** nonceOverride: The nonce to use for the transaction */
  nonceOverride?: bigint
}

export type Service = "Bundler" | "Paymaster"
export type BigNumberish = Hex | number | bigint
export type BytesLike = Uint8Array | Hex | string

//#region UserOperationStruct
// based on @account-abstraction/common
// this is used for building requests
export type UserOperationStruct = {
  sender: Address
  nonce: bigint
  factory?: Address
  factoryData?: Hex
  callData: Hex
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymaster?: Address
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  paymasterData?: Hex
  signature: Hex
  // initCode?: never
  paymasterAndData?: never
}
//#endregion UserOperationStruct

export type EIP712DomainReturn = [
  Hex,
  string,
  string,
  bigint,
  Address,
  Hex,
  bigint[]
]

export type AccountMetadata = {
  name: string
  version: string
  chainId: bigint
}

export type TypeField = {
  name: string
  type: string
}

export type TypeDefinition = {
  [key: string]: TypeField[]
}

export type GetNonceArgs = {
  key?: bigint | undefined
  validationMode?: "0x00" | "0x01"
  nonceOptions?: NonceOptions
}
export type Call = {
  to: Hex
  data?: Hex | undefined
  value?: bigint | undefined
}
