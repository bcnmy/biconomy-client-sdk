import { Chain, Hex } from "viem";
import { UserOperationStruct, WalletClientSigner } from "@alchemy/aa-core";
import { SessionKeyManagerModule } from "../SessionKeyManagerModule";
import { ISessionStorage } from "../interfaces/ISessionStorage";

export type ModuleVersion = "V1_0_0"; // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  entryPointAddress?: Hex;
}

export interface ECDSAOwnershipValidationModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: Hex;
  version?: ModuleVersion;
  signer: WalletClientSigner;
}

export interface SessionKeyManagerModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: Hex;
  version?: ModuleVersion;
  nodeClientUrl?: string;
  smartAccountAddress: string;
  storageType?: StorageType;
  sessionStorageClient?: ISessionStorage;
}

export interface BatchedSessionRouterModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: Hex;
  version?: ModuleVersion;

  sessionKeyManagerModule?: SessionKeyManagerModule; // could be BaseValidationModule

  sessionManagerModuleAddress?: Hex;
  nodeClientUrl?: string;
  smartAccountAddress: string;
  storageType?: StorageType;

  // sessionSigner?: Signer
  // sessionPubKey?: string
  // nodeClientUrl?: string
}

export enum StorageType {
  LOCAL_STORAGE,
}

export type SessionParams = {
  sessionID?: string;
  sessionSigner: WalletClientSigner;
  sessionValidationModule?: Hex;
  additionalSessionData?: string;
};

export type ModuleInfo = {
  // Could be a full object of below params and that way it can be an array too!
  // sessionParams?: SessionParams[] // where SessionParams is below four
  sessionID?: string;
  sessionSigner?: WalletClientSigner;
  sessionValidationModule?: Hex;
  additionalSessionData?: string;
  batchSessionParams?: SessionParams[];
};

export interface SendUserOpParams extends ModuleInfo {
  simulationType?: SimulationType;
}

export type SimulationType = "validation" | "validation_and_execution";

export type SignerData = {
  pbKey: string;
  pvKey: string;
  chainId?: Chain;
}

export type CreateSessionDataResponse = {
  data: string;
  sessionIDInfo: Array<string>;
};

export interface CreateSessionDataParams {
  validUntil: number;
  validAfter: number;
  sessionValidationModule: Hex;
  sessionPublicKey: Hex;
  sessionKeyData: Hex;
  preferredSessionId?: string;
}

export interface MultiChainValidationModuleConfig extends BaseValidationModuleConfig {
  moduleAddress?: Hex;
  version?: ModuleVersion;
  signer: WalletClientSigner;
}

export type MultiChainUserOpDto = {
  validUntil?: number;
  validAfter?: number;
  chainId: number;
  userOp: Partial<UserOperationStruct>;
};

export interface BaseSessionKeyData {
  sessionKey: Hex;
}

export interface ERC20SessionKeyData extends BaseSessionKeyData {
  token: Hex;
  recipient: Hex;
  maxAmount: bigint;
}

export interface SessionValidationModuleConfig {
  moduleAddress: string;
}
