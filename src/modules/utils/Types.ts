import type { AbiFunction, Address, Chain, Hex } from "viem"
import type {
  CallType,
  SimulationType,
  SmartAccountSigner,
  SupportedSigner,
  UserOperationStruct
} from "../../account"
import { Rule } from "./SmartSessionHelpers"
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
  signer: SupportedSigner
}

export interface K1ValidatorModuleConfigConstructorProps
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: Converted from viemWallet or ethers signer to SmartAccountSigner */
  signer: SmartAccountSigner
}

// export interface SessionKeyManagerModuleConfig
//   extends BaseValidationModuleConfig {
//   /** Address of the module */
//   moduleAddress?: Hex
//   /** Version of the module */
//   version?: ModuleVersion
//   /** SmartAccount address */
//   smartAccountAddress: Hex
//   storageType?: StorageType
//   sessionStorageClient?: ISessionStorage
// }

// export interface BatchedSessionRouterModuleConfig
//   extends BaseValidationModuleConfig {
//   /** Address of the module */
//   moduleAddress?: Hex
//   /** Version of the module */
//   version?: ModuleVersion
//   /** Session Key Manager module: Could be BaseValidationModule */
//   sessionKeyManagerModule?: SessionKeyManagerModule
//   /** Session Key Manager module address */
//   sessionManagerModuleAddress?: Hex
//   /** Address of the associated smart account */
//   smartAccountAddress: Hex
//   /** Storage type, e.g. local storage */
//   storageType?: StorageType
// }

export enum StorageType {
  LOCAL_STORAGE = 0,
  MEMORY_STORAGE = 1
}

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
  sessionSigner: SupportedSigner
  /** The session validation module is a sub-module smart-contract which works with session key manager validation module. It validates the userop calldata against the defined session permissions (session key data) within the contract. */
  sessionValidationModule?: Hex
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string
}

export type StrictSessionParams = {
  sessionID: string
  sessionSigner: SupportedSigner
}

export type ModuleInfo = {
  // Could be a full object of below params and that way it can be an array too!
  // sessionParams?: SessionParams[] // where SessionParams is below four
  sessionID?: string
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionSigner?: SupportedSigner
  /** The session validation module is a sub-module smart-contract which works with session key manager validation module. It validates the userop calldata against the defined session permissions (session key data) within the contract. */
  sessionValidationModule?: Hex
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string
  /** Batch session params */
  batchSessionParams?: SessionParams[]
}

export interface SendUserOpParams extends ModuleInfo {
  /** "validation_and_execution" is recommended during development for improved debugging & devEx, but will add some additional latency to calls. "validation" can be used in production ro remove this latency once flows have been tested. */
  simulationType?: SimulationType
}

export type SignerData = {
  /** This is not the public as provided by viem, key but address for the given pvKey */
  pbKey: Hex
  /** Private key */
  pvKey: Hex
}

export type ChainInfo = number | Chain

export type CreateSessionDataResponse = {
  data: string
  sessionIDInfo: Array<string>
}

// Todo: marked for deletion
export interface MultiChainValidationModuleConfig
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SupportedSigner
}
export interface MultiChainValidationModuleConfigConstructorProps
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SmartAccountSigner
}

export type MultiChainUserOpDto = {
  /** window end timestamp */
  validUntil?: number
  /** window start timestamp */
  validAfter?: number
  chainId: number
  userOp: Partial<UserOperationStruct>
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

export interface SessionValidationModuleConfig {
  /** Address of the module */
  moduleAddress: string
}

export type V3ModuleInfo = {
  module: Address
  data: Hex
  additionalContext: Hex
  type: ModuleType
  hook?: Address
}

export type Execution = {
  target: Address
  value: bigint
  callData: Hex
}

// Review: where is this coming from?
export enum SafeHookType {
  GLOBAL = 0,
  SIG = 1
}

export type Module = {
  moduleAddress: Address
  data?: Hex
  additionalContext?: Hex
  type: ModuleType

  /* ---- kernel module params ---- */
  // these param needed for installing validator, executor, fallback handler
  hook?: Address
  /* ---- end kernel module params ---- */

  /* ---- safe module params ---- */

  // these two params needed for installing hooks
  hookType?: SafeHookType
  selector?: Hex

  // these two params needed for installing fallback handlers
  functionSig?: Hex
  callType?: CallType

  /* ---- end safe module params ---- */
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

// Types for Smart sessions utils
// Note: can import from ModuleKit

export type Session = {
  sessionValidator: Address // deployed SimpleSigner
  sessionValidatorInitData: Hex // abi.encodePacked sessionKeyEOA
  salt: Hex // random salt
  userOpPolicies: PolicyData[] // empty policies by default
  erc7739Policies: ERC7739Data // empty policies by default
  actions: ActionData[] // make uni action policy
}

export type SessionEIP712 = {
  account: Address
  smartSession: Address
  mode: number
  nonce: bigint
  sessionValidator: Address
  sessionValidatorInitData: Hex
  salt: Hex
  userOpPolicies: PolicyData[]
  erc7739Policies: ERC7739Data
  actions: ActionData[]
}

export type PolicyData = {
  policy: Address
  initData: Hex
}

export type ERC7739Data = {
  allowedERC7739Content: string[]
  erc1271Policies: PolicyData[]
}

export type ActionData = {
  actionTargetSelector: Hex
  actionTarget: Address
  actionPolicies: PolicyData[]
}

export type ChainDigest = {
  chainId: bigint
  sessionDigest: Hex
}

export type ChainSession = {
  chainId: bigint
  session: SessionEIP712
}

export const SmartSessionMode = {
  USE: '0x00' as Hex,
  ENABLE: '0x01' as Hex,
  UNSAFE_ENABLE: '0x02' as Hex,
} as const

export type SmartSessionModeType =
  (typeof SmartSessionMode)[keyof typeof SmartSessionMode]

export type EnableSession = {
  chainDigestIndex: number
  hashesAndChainIds: ChainDigest[]
  sessionToEnable: Session
  permissionEnableSig: Hex
}
  
export type EnableSessionData = {
  enableSession: EnableSession
  validator: Address
  // accountType: AccountType // Temp
}

// Types for creating session with abi SVM

// Note: keep Dan stuff for later
export type DanModuleInfo = {
  /** Ephemeral sk */
  jwt: string
  /** eoa address */
  eoaAddress: Hex
  /** threshold */
  threshold: number
  /** parties number */
  partiesNumber: number
  /** userOp to be signed */
  userOperation?: Partial<UserOperationStruct>
  /** chainId */
  chainId: number
  /** selected mpc key id */
  mpcKeyId: string
}

export interface CreateSessionDataParams {
  // TimeLimitPolicy?
  // /** window end for the session key */
  // validUntil: number
  // /** window start for the session key */
  // validAfter: number
  // /** Address of the session validation module */

  // Note: below is only taking information specific to universal policy.
  // Other two fields of seesions object (7739 policy and userOp policy will be empty by default)
  // We should have means to get information on how to build those too

  sessionPublicKey: Hex

  sessionValidatorAddress: Address // constant for a type of validator

  sessionKeyData: Hex

  /** The address of the contract to be included in the policy */
  contractAddress: Hex;

  /** The specific function selector from the contract to be included in the policy */
  functionSelector: string | AbiFunction;

  /** The rules  to be included in the policy */
  rules: Rule[];

  /** The maximum value that can be transferred in a single transaction */
  valueLimit: bigint;

  // Review
  /** we generate uuid based sessionId. but if you prefer to track it on your side and attach custom session identifier this can be passed */
  preferredSessionId?: string
  /** Dan module info */
  danModuleInfo?: DanModuleInfo
}

