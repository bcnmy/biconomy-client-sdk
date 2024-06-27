import type { Chain, Hex } from "viem"
import type {
  SimulationType,
  SmartAccountSigner,
  SupportedSigner,
  UserOperationStruct
} from "../../account"
import type { SessionKeyManagerModule } from "../SessionKeyManagerModule.js"
import type { ISessionStorage } from "../interfaces/ISessionStorage.js"
export type ModuleVersion = "V1_0_0" // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  /** entryPointAddress: address of the entry point */
  entryPointAddress?: Hex
}

export interface ECDSAOwnershipValidationModuleConfig
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SupportedSigner
}

export interface ECDSAOwnershipValidationModuleConfigConstructorProps
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: Converted from viemWallet or ethers signer to SmartAccountSigner */
  signer: SmartAccountSigner
}

export interface SessionKeyManagerModuleConfig
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** SmartAccount address */
  smartAccountAddress: Hex
  storageType?: StorageType
  sessionStorageClient?: ISessionStorage
}

export interface BatchedSessionRouterModuleConfig
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Session Key Manager module: Could be BaseValidationModule */
  sessionKeyManagerModule?: SessionKeyManagerModule
  /** Session Key Manager module address */
  sessionManagerModuleAddress?: Hex
  /** Address of the associated smart account */
  smartAccountAddress: Hex
  /** Storage type, e.g. local storage */
  storageType?: StorageType
}

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
  /** Ephemeral sk */
  ephSK?: Uint8Array
  /** eoa address */
  eoaAddress?: string
  /** scw address */
  scwAddress?: string
  /** threshold */
  threshold?: number
  /** parties number */
  partiesNumber?: number
  /** userOp to be signed */
  userOp?: Partial<UserOperationStruct>
  /** session public key */
  sessionKeyEOA?: Hex
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

export interface CreateSessionDataParams {
  /** window end for the session key */
  validUntil: number
  /** window start for the session key */
  validAfter: number
  /** Address of the session validation module */
  sessionValidationModule: Hex
  /** Public key of the session */
  sessionPublicKey: Hex
  /** The hex of the rules {@link Rule} that make up the policy */
  sessionKeyData: Hex
  /** we generate uuid based sessionId. but if you prefer to track it on your side and attach custom session identifier this can be passed */
  preferredSessionId?: string
}

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
