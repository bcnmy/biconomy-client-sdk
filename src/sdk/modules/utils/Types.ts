import type { AbiFunction, Address, Chain, Hex } from "viem"
import type { Signer, UnknownSigner } from "../../account/utils/toSigner"
import { SmartSessionMode } from "@rhinestone/module-sdk"

export type ModuleVersion = "1.0.0-beta" // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  /** entryPointAddress: address of the entry point */
  entryPointAddress?: Hex
}

export interface K1ValidationModuleConfig extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: UnknownSigner
}

export interface K1ValidatorModuleConfigConstructorProps
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: Converted from viemWallet or ethers signer to Signer */
  signer: Signer
}

export interface SendUserOpParams extends ModuleInfo {}

export type SignerData = {
  /** This is not the public as provided by viem, key but address for the given pvKey */
  pbKey: Hex
  /** Private key */
  pvKey: Hex
}

export type ChainInfo = number | Chain

// Review if needed
export type V3ModuleInfo = {
  module: Address
  data: Hex
  additionalContext: Hex
  type: ModuleType
  hook?: Address
}

// Review: if needed can be replaced by 'Action' type
export type Execution = {
  target: Address
  value: bigint
  callData: Hex
}

export enum SafeHookType {
  GLOBAL = 0,
  SIG = 1
}

export type ModuleType = "validator" | "executor" | "fallback" | "hook"

type ModuleTypeIds = {
  [index in ModuleType]: 1 | 2 | 3 | 4
}

export const moduleTypeIds: ModuleTypeIds = {
  validator: 1,
  executor: 2,
  fallback: 3,
  hook: 4
}

export type ModuleInfo = {
  /** Smart session mode */
  mode?: SmartSessionModeType
  /** Permission ID for smart session */
  permissionId?: Hex
}

// Session specific types

export type SessionDataTuple = [
  bigint | number,
  bigint | number,
  Hex,
  Hex,
  string[],
  string
]

export type SessionParams = {
  /** ID of the session */
  sessionID?: string
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionSigner: UnknownSigner
  /** The session validation module is a sub-module smart-contract which works with session key manager validation module. It validates the userop calldata against the defined session permissions (session key data) within the contract. */
  sessionValidationModule?: Hex
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string
}

export type StrictSessionParams = {
  sessionID: string
  sessionSigner: UnknownSigner
}

export type SmartSessionModeType =
  (typeof SmartSessionMode)[keyof typeof SmartSessionMode]
  
/// @notice per session what you require is salt, sessionValidator, info to initialise that validator
/// @notice what you also require is userOpPolicies and actionPolicies
/// @notice what you may also add is 7739 policies
/// @notice action policies can be stacked for particular func selector and destination address and they will all make single session object, single policy   
export type CreateSessionDataParams = {
  sessionPublicKey?: Hex // Works in case of session validator address is K1 algorithm. for other validators made up sessionData is needed

  sessionValidatorAddress: Address // constant for a type of validator

  sessionValidatorType?: string // usually simple K1 validator. ECDSA session key

  sessionKeyData: Hex

  salt?: Hex

  // session validity means this will be applied as UseropPolicy through time frame policy
  sessionValidUntil?: number

  sessionValidAfter?: number

  // note: either I accept already cooked up policies.
  // note: policy is just it's address and initdata for that policy.
  // you may apply it as userOpPolicy or actionPolicy 
  // or I accept params and make policies accordingly and apply to the session
  // userOpPolicies?: PolicyData[]
  //actionPolicies?: PolicyData[]
  //erc7739Policies?: PolicyData[]

  actionPoliciesInfo: ActionPolicyData[]
} 

export type ActionPolicyData = {
     /** The address of the contract to be included in the policy */
  contractAddress: Hex;

  /** The specific function selector from the contract to be included in the policy */
  functionSelector: string | AbiFunction;

  validUntil: number

  validAfter: number

  rules: ParamRule[];

  /** The maximum value that can be transferred in a single transaction */
  valueLimit: bigint;
}

// Note: this is only relevant for USE mode. as we're requesting data
// Note: either we make different method for enable mode which will give us the signature and other info like digests to store.
// What is common in both USE and ENABLE mode is how session object is formed.
export type CreateSessionDataResponse = {
  permissionIds: Hex[]
  sessionsEnableData: Hex
}

export interface BaseSessionKeyData {
  sessionKey: Hex
}

export interface ERC20SessionKeyData extends BaseSessionKeyData {
  /** ERC20 token address */
  token: Hex
  /** Recipient address */
  recipient: Hex
  /** ERC20 amount (Bigint) */
  maxAmount: bigint
}

// Temp
// Todo: later import from module-sdk
// Uni Action Policy Types

export type ActionConfig = {
  valueLimitPerUse: bigint
  paramRules: ParamRules
}

export type ParamRules = {
  length: number
  rules: ParamRule[]
}

export type ParamRule = {
  condition: ParamCondition
  offset: number
  isLimited: boolean
  ref: Hex
  usage: LimitUsage
}

export type RawActionConfig = {
  valueLimitPerUse: bigint
  paramRules: RawParamRules
}

export type RawParamRules = {
  length: bigint
  rules: RawParamRule[]
}

export type RawParamRule = {
  condition: ParamCondition
  offset: bigint
  isLimited: boolean
  ref: Hex
  usage: LimitUsage
}

export type LimitUsage = {
  limit: bigint
  used: bigint
}

export enum ParamCondition {
  EQUAL,
  GREATER_THAN,
  LESS_THAN,
  GREATER_THAN_OR_EQUAL,
  LESS_THAN_OR_EQUAL,
  NOT_EQUAL,
}