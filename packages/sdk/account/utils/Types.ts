import type { Address, Hash, Hex, Log, SignTypedDataParameters } from "viem"
import type { ModuleInfo, ModuleType } from "../../modules"
import type { BaseValidationModule } from "../../modules/base/BaseValidationModule"
import type { MODE_MODULE_ENABLE, MODE_VALIDATION } from "./Constants"
import type { Holder } from "./toHolder"

export type EntryPointAddresses = Record<string, string>
export type BiconomyFactories = Record<string, string>
export type EntryPointAddressesByVersion = Record<string, string>
export type BiconomyFactoriesByVersion = Record<string, string>

export type UserOpGasResponse = {
  preVerificationGas: bigint
  verificationGasLimit: bigint
  callGasLimit: bigint
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
}
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

export type UserOpResponse = {
  userOpHash: Hash
  wait(_confirmations?: number): Promise<UserOpReceipt>
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

export type JsonRpcError = {
  code: string
  message: string
  data: any
}

export type GetUserOpByHashResponse = {
  jsonrpc: string
  id: number
  result: UserOpByHashResponse
  error?: JsonRpcError
}

export type UserOpStatus = {
  state: string // for now // could be an enum
  transactionHash?: string
  userOperationReceipt?: UserOpReceipt
}

export type UserOpByHashResponse = UserOperationStruct & {
  transactionHash: string
  blockNumber: number
  blockHash: string
  entryPoint: string
}

export interface IBundler {
  estimateUserOpGas(
    _userOp: Partial<UserOperationStruct>,
    stateOverrideSet?: StateOverrideSet
  ): Promise<UserOpGasResponse>
  sendUserOp(_userOp: UserOperationStruct): Promise<UserOpResponse>
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>
  getGasFeeValues(): Promise<GetUserOperationGasPriceReturnType>
  getUserOpStatus(_userOpHash: string): Promise<UserOpStatus>
  getBundlerUrl(): string
}

export type PaymasterAndDataResponse = {
  paymasterAndData: Hex
  /* Gas overhead of this UserOperation */
  preVerificationGas: number
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit: number
  /* Value used by inner account execution */
  callGasLimit: number
}

export interface IPaymaster {
  // Implementing class may add extra parameter (for example paymasterServiceData with it's own type) in below function signature
  getPaymasterAndData(
    _userOp: Partial<UserOperationStruct>
  ): Promise<PaymasterAndDataResponse>
  getDummyPaymasterAndData(
    _userOp: Partial<UserOperationStruct>
  ): Promise<string>
}
export type PaymasterFeeQuote = {
  /** symbol: Token symbol */
  symbol: string
  /** tokenAddress: Token address */
  tokenAddress: string
  /** decimal: Token decimal */
  decimal: number
  logoUrl?: string
  /** maxGasFee: in wei */
  maxGasFee: number
  /** maxGasFee: in dollars */
  maxGasFeeUSD?: number
  usdPayment?: number
  /** The premium paid on the token */
  premiumPercentage: number
  /** validUntil: Unix timestamp */
  validUntil?: number
}

export type SponsorUserOperationDto = {
  /** mode: sponsored or erc20 */
  mode: "SPONSORED" | "ERC20"
  /** Always recommended, especially when using token paymaster */
  calculateGasLimits?: boolean
  /** Expiry duration in seconds */
  expiryDuration?: number
  /** Webhooks to be fired after user op is sent */
  webhookData?: Record<string, any>
  /** Smart account meta data */
  smartAccountInfo?: SmartAccountData
  /** the fee-paying token address */
  feeTokenAddress?: string
}

export type SmartAccountData = {
  /** name: Name of the smart account */
  name: string
  /** version: Version of the smart account */
  version: string
}

export type SmartAccountConfig = {
  /** entryPointAddress: address of the entry point */
  entryPointAddress: Address
  /** factoryAddress: address of the smart account factory */
  bundler?: IBundler
}

export interface BalancePayload {
  /** address: The address of the account */
  address: string
  /** chainId: The chainId of the network */
  chainId: number
  /** amount: The amount of the balance */
  amount: bigint
  /** decimals: The number of decimals */
  decimals: number
  /** formattedAmount: The amount of the balance formatted */
  formattedAmount: string
}

export interface WithdrawalRequest {
  /** The address of the asset */
  address: Hex
  /** The amount to withdraw. Expects unformatted amount. Will use max amount if unset */
  amount?: bigint
  /** The destination address of the funds. The second argument from the `withdraw(...)` function will be used as the default if left unset. */
  recipient?: Hex
}

export interface GasOverheads {
  /** fixed: fixed gas overhead */
  fixed: number
  /** perUserOp: per user operation gas overhead */
  perUserOp: number
  /** perUserOpWord: per user operation word gas overhead */
  perUserOpWord: number
  /** zeroByte: per byte gas overhead */
  zeroByte: number
  /** nonZeroByte: per non zero byte gas overhead */
  nonZeroByte: number
  /** bundleSize: per signature bundleSize */
  bundleSize: number
  /** sigSize: sigSize gas overhead */
  sigSize: number
}

export type BaseSmartAccountConfig = {
  /** index: helps to not conflict with other smart account instances */
  index?: bigint
  /** entryPointAddress: address of the smart account entry point */
  entryPointAddress?: string
  /** accountAddress: address of the smart account, potentially counterfactual */
  accountAddress?: string
  /** overheads: {@link GasOverheads} */
  overheads?: Partial<GasOverheads>
  /** paymaster: {@link IPaymaster} interface */
  paymaster?: IPaymaster
}

export type BiconomyTokenPaymasterRequest = {
  /** feeQuote: {@link PaymasterFeeQuote} */
  feeQuote: PaymasterFeeQuote
  /** spender: The address of the spender who is paying for the transaction, this can usually be set to feeQuotesResponse.tokenPaymasterAddress */
  spender: Hex
  /** maxApproval: If set to true, the paymaster will approve the maximum amount of tokens required for the transaction. Not recommended */
  maxApproval?: boolean
  /* skip option to patch callData if approval is already given to the paymaster */
  skipPatchCallData?: boolean
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type ConditionalBundlerProps = RequireAtLeastOne<
  {
    bundler: IBundler
    bundlerUrl: string
  },
  "bundler" | "bundlerUrl"
>
export type ResolvedBundlerProps = {
  bundler: IBundler
}

export type ResolvedValidationProps = {
  /** defaultValidationModule: {@link BaseValidationModule} */
  defaultValidationModule: BaseValidationModule
  /** activeValidationModule: {@link BaseValidationModule}. The active validation module. Will default to the defaultValidationModule */
  activeValidationModule: BaseValidationModule
  /** holder */
  holder: Holder
  /** rpcUrl */
  rpcUrl: string
}

export type ConfigurationAddresses = {
  factoryAddress: Hex
  k1ValidatorAddress: Hex
  entryPointAddress: Hex
}

/**
 * Represents options for building a user operation.
 * @typedef BuildUserOpOptions
 * @property {GasOffset} [gasOffset] - Increment gas values by giving an offset, the given value will be an increment to the current estimated gas values, not an override.
 * @property {ModuleInfo} [params] - Parameters relevant to the module, mostly relevant to sessions.
 * @property {NonceOptions} [nonceOptions] - Options for overriding the nonce.
 * @property {boolean} [forceEncodeForBatch] - Whether to encode the user operation for batch.
 * @property {PaymasterUserOperationDto} [paymasterServiceData] - Options specific to transactions that involve a paymaster.
 * @property {SimulationType} [simulationType] - Determine which parts of the transaction a bundler will simulate: "validation" | "validation_and_execution".
 * @property {StateOverrideSet} [stateOverrideSet] - For overriding the state.
 * @property {boolean} [useEmptyDeployCallData] - Set to true if the transaction is being used only to deploy the smart contract, so "0x" is set as the user operation call data.
 */
export type BuildUserOpOptions = {
  gasOffset?: GasOffsetPct
  params?: ModuleInfo
  nonceOptions?: NonceOptions
  forceEncodeForBatch?: boolean
  paymasterServiceData?: PaymasterUserOperationDto
  simulationType?: SimulationType
  stateOverrideSet?: StateOverrideSet
  dummyPndOverride?: BytesLike
  useEmptyDeployCallData?: boolean
  useExecutor?: boolean
}

export type NonceOptions = {
  /** nonceKey: The key to use for nonce */
  nonceKey?: bigint
  /** validationMode: Mode of the validation module */
  validationMode?: typeof MODE_VALIDATION | typeof MODE_MODULE_ENABLE
  /** nonceOverride: The nonce to use for the transaction */
  nonceOverride?: bigint
}

export type SimulationType = "validation" | "validation_and_execution"

/**
 * Represents an offset percentage value used for gas-related calculations.
 * @remarks
 * This type defines offset percentages for various gas-related parameters. Each percentage represents a proportion of the current estimated gas values.
 * For example:
 * - A value of `1` represents a 1% offset.
 * - A value of `100` represents a 100% offset.
 * @public
 */
/**
 * Represents an object containing offset percentages for gas-related parameters.
 * @typedef GasOffsetPct
 * @property {number} [callGasLimitOffsetPct] - Percentage offset for the gas limit used by inner account execution.
 * @property {number} [verificationGasLimitOffsetPct] - Percentage offset for the actual gas used by the validation of a UserOperation.
 * @property {number} [preVerificationGasOffsetPct] - Percentage offset representing the gas overhead of a UserOperation.
 * @property {number} [maxFeePerGasOffsetPct] - Percentage offset for the maximum fee per gas (similar to EIP-1559 max_fee_per_gas).
 * @property {number} [maxPriorityFeePerGasOffsetPct] - Percentage offset for the maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas).
 */
export type GasOffsetPct = {
  callGasLimitOffsetPct?: number
  verificationGasLimitOffsetPct?: number
  preVerificationGasOffsetPct?: number
  maxFeePerGasOffsetPct?: number
  maxPriorityFeePerGasOffsetPct?: number
}

export type InitilizationData = {
  accountIndex?: number
  signerAddress?: string
}

export type FeeQuotesOrDataDto = {
  /** mode: sponsored or erc20 */
  mode?: "SPONSORED" | "ERC20"
  /** Expiry duration in seconds */
  expiryDuration?: number
  /** Always recommended, especially when using token paymaster */
  calculateGasLimits?: boolean
  /** List of tokens to be used for fee quotes, if ommitted fees for all supported will be returned */
  tokenList?: string[]
  /** preferredToken: Can be ommitted to return all quotes */
  preferredToken?: string
  /** Webhooks to be fired after user op is sent */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  webhookData?: Record<string, any>
  /** Smart account meta data */
  smartAccountInfo?: SmartAccountData
}

export type PaymasterUserOperationDto = SponsorUserOperationDto &
  FeeQuotesOrDataDto & {
    /** mode: sponsored or erc20 */
    mode: "SPONSORED" | "ERC20"
    /** Always recommended, especially when using token paymaster */
    calculateGasLimits?: boolean
    /** Expiry duration in seconds */
    expiryDuration?: number
    /** Webhooks to be fired after user op is sent */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    webhookData?: Record<string, any>
    /** Smart account meta data */
    smartAccountInfo?: SmartAccountData
    /** the fee-paying token address */
    feeTokenAddress?: string
    /** The fee quote */
    feeQuote?: PaymasterFeeQuote
    /** The address of the spender. This is usually set to FeeQuotesOrDataResponse.tokenPaymasterAddress  */
    spender?: Hex
    /** Not recommended */
    maxApproval?: boolean
    /* skip option to patch callData if approval is already given to the paymaster */
    skipPatchCallData?: boolean
  }

export type InitializeV2Data = {
  accountIndex?: number
}

export type EstimateUserOpGasParams = {
  userOp: Partial<UserOperationStruct>
  /**  paymasterServiceData: Options specific to transactions that involve a paymaster */
  paymasterServiceData?: SponsorUserOperationDto
}

export interface TransactionDetailsForUserOp {
  /** target: The address of the contract to call */
  target: string
  /** data: The data to send to the contract */
  data: string
  /** value: The value to send to the contract */
  value?: BigNumberish
  /** gasLimit: The gas limit to use for the transaction */
  gasLimit?: BigNumberish
  /** maxFeePerGas: The maximum fee per gas to use for the transaction */
  maxFeePerGas?: BigNumberish
  /** maxPriorityFeePerGas: The maximum priority fee per gas to use for the transaction */
  maxPriorityFeePerGas?: BigNumberish
  /** nonce: The nonce to use for the transaction */
  nonce?: BigNumberish
}

export type CounterFactualAddressParam = {
  index?: bigint
  validationModule?: BaseValidationModule
  /** scanForUpgradedAccountsFromV1: set to true if you you want the userwho was using biconomy SA v1 to upgrade to biconomy SA v2 */
  scanForUpgradedAccountsFromV1?: boolean
  /** the index of SA the EOA have generated and till which indexes the upgraded SA should scan */
  maxIndexForScan?: bigint
}

export type QueryParamsForAddressResolver = {
  eoaAddress: Hex
  index: bigint
  moduleAddress: Hex
  moduleSetupData: Hex
  maxIndexForScan?: bigint
}

export type SmartAccountInfo = {
  /** accountAddress: The address of the smart account */
  accountAddress: Hex
  /** factoryAddress: The address of the smart account factory */
  factoryAddress: Hex
  /** currentImplementation: The address of the current implementation */
  currentImplementation: string
  /** currentVersion: The version of the smart account */
  currentVersion: string
  /** factoryVersion: The version of the factory */
  factoryVersion: string
  /** deploymentIndex: The index of the deployment */
  deploymentIndex: BigNumberish
}

export type ValueOrData = RequireAtLeastOne<
  {
    value: BigNumberish | string
    data: string
  },
  "value" | "data"
>

export type SupportedToken = Omit<
  PaymasterFeeQuote,
  "maxGasFeeUSD" | "usdPayment" | "maxGasFee" | "validUntil"
> & { balance: BalancePayload }

export type Signer = LightSigner & {
  // biome-ignore lint/suspicious/noExplicitAny: any is used here to allow for the ethers provider
  provider: any
}
export type SupportedSignerName = "alchemy" | "ethers" | "viem"
export type Service = "Bundler" | "Paymaster"

export interface LightSigner {
  getAddress(): Promise<string>
  signMessage(message: string | Uint8Array): Promise<string>
}

export type StateOverrideSet = {
  [key: string]: {
    balance?: string
    nonce?: string
    code?: string
    state?: object
    stateDiff?: object
  }
}

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

//#region UserOperationCallData
export type UserOperationCallData =
  | {
      /* the target of the call */
      target: Address
      /* the data passed to the target */
      data: Hex
      /* the amount of native token to send to the target (default: 0) */
      value?: bigint
    }
  | Hex
//#endregion UserOperationCallData

//#region BatchUserOperationCallData
export type BatchUserOperationCallData = Exclude<UserOperationCallData, Hex>[]
//#endregion BatchUserOperationCallData

export type SignTypedDataParams = Omit<SignTypedDataParameters, "privateKey">

export type TransferOwnershipCompatibleModule =
  | "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e"
  | "0x000000824dc138db84FD9109fc154bdad332Aa8E"

export type ModuleInfoParams = {
  moduleAddress: Address
  moduleType: ModuleType
  moduleSelector?: Hex
  data?: Hex
}

export type EIP712DomainReturn = [
  Hex,
  string,
  string,
  bigint,
  Address,
  Hex,
  bigint[]
]

export enum CallType {
  CALLTYPE_SINGLE = "0x00",
  CALLTYPE_BATCH = "0x01",
  CALLTYPE_STATIC = "0xFE",
  CALLTYPE_DELEGATECALL = "0xFF"
}

export type NEXUS_VERSION_TYPE = "1.0.0-beta"

export type AccountMetadata = {
  name: string
  version: string
  chainId: bigint
}

export type WithRequired<T, K extends keyof T> = Required<Pick<T, K>>

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

export type PartiallyOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>
