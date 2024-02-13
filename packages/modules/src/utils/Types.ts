import { Chain, Hex } from "viem";
import { UserOperationStruct, SmartAccountSigner } from "@alchemy/aa-core";
import { SessionKeyManagerModule } from "../SessionKeyManagerModule";
import { ISessionStorage } from "../interfaces/ISessionStorage.js";
import { SupportedSigner } from "@biconomy/common";
export type ModuleVersion = "V1_0_0"; // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  /** entryPointAddress: address of the entry point */
  entryPointAddress?: Hex;
}

export interface ECDSAOwnershipValidationModuleConfig extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex;
  /** Version of the module */
  version?: ModuleVersion;
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SupportedSigner;
}

export interface ECDSAOwnershipValidationModuleConfigConstructorProps extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex;
  /** Version of the module */
  version?: ModuleVersion;
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SupportedSigner;
}

export interface SessionKeyManagerModuleConfig extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex;
  /** Version of the module */
  version?: ModuleVersion;
  /** SmartAccount address */
  smartAccountAddress: string;
  storageType?: StorageType;
  sessionStorageClient?: ISessionStorage;
}

export interface BatchedSessionRouterModuleConfig extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex;
  /** Version of the module */
  version?: ModuleVersion;
  /** Session Key Manager module: Could be BaseValidationModule */
  sessionKeyManagerModule?: SessionKeyManagerModule;
  /** Session Key Manager module address */
  sessionManagerModuleAddress?: Hex;
  /** Address of the associated smart account */
  smartAccountAddress: string;
  /** Storage type, e.g. local storage */
  storageType?: StorageType;
}

export enum StorageType {
  LOCAL_STORAGE,
}

export type SessionParams = {
  /** Redundant now as we've favoured uuid() */
  sessionID?: string;
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionSigner: SupportedSigner;
  /** The session validation module which contains the logic on how to decode the session call data. for example erc20 session validation validates the amount of erc20 transfer */
  sessionValidationModule?: Hex;
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string;
};

export type ModuleInfo = {
  // Could be a full object of below params and that way it can be an array too!
  // sessionParams?: SessionParams[] // where SessionParams is below four
  sessionID?: string;
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionSigner?: SupportedSigner;
  /** The session validation module which contains the logic on how to decode the session call data. for example erc20 session validation validates the amount of erc20 transfer */
  sessionValidationModule?: Hex;
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string;
  batchSessionParams?: SessionParams[];
};

export interface SendUserOpParams extends ModuleInfo {
  /** Type of similation: validation or validation_and_execution */
  simulationType?: SimulationType;
}

export type SimulationType = "validation" | "validation_and_execution";

export type SignerData = {
  /** Public key */
  pbKey: string;
  /** Private key */
  pvKey: `0x${string}`;
  /** Network Id */
  chainId?: Chain;
};

export type CreateSessionDataResponse = {
  data: string;
  sessionIDInfo: Array<string>;
};

export interface CreateSessionDataParams {
  /** window end for the session key */
  validUntil: number;
  /** window start for the session key */
  validAfter: number;
  sessionValidationModule: Hex;
  sessionPublicKey: Hex;
  sessionKeyData: Hex;
  /** if multiple session keys are there can pass the uuid here to filter that session key EOA */
  preferredSessionId?: string;
}

export interface MultiChainValidationModuleConfig extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex;
  /** Version of the module */
  version?: ModuleVersion;
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SupportedSigner;
}
export interface MultiChainValidationModuleConfigConstructorProps extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex;
  /** Version of the module */
  version?: ModuleVersion;
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: SupportedSigner;
}

export type MultiChainUserOpDto = {
  /** window end timestamp */
  validUntil?: number;
  /** window start timestamp */
  validAfter?: number;
  chainId: number;
  userOp: Partial<UserOperationStruct>;
};

export interface BaseSessionKeyData {
  sessionKey: Hex;
}

export interface ERC20SessionKeyData extends BaseSessionKeyData {
  /** ERC20 token address */
  token: Hex;
  /** Recipient address */
  recipient: Hex;
  /** ERC20 amount (Bigint) */
  maxAmount: bigint;
}

export interface SessionValidationModuleConfig {
  /** Address of the module */
  moduleAddress: string;
}
