import type { Hex } from "viem"
import type {
  SimulationType,
  SmartAccountSigner,
  SupportedSigner,
  UserOperationStruct
} from "../../account"
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

export type SessionParams = {
  /** Redundant now as we've favoured uuid() */
  sessionID?: string
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionSigner: SupportedSigner
  /** The session validation module is a sub-module smart-contract which works with session key manager validation module. It validates the userop calldata against the defined session permissions (session key data) within the contract. */
  sessionValidationModule?: Hex
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string
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
  address: Hex
  /** Private key */
  pvKey: Hex
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
