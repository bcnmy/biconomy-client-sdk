import { Signer } from "ethers";
import { BigNumberish, BigNumber } from "ethers";
import { IBundler } from "@biconomy/bundler";
import { IPaymaster, PaymasterFeeQuote, SponsorUserOperationDto } from "@biconomy/paymaster";
import { BaseValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE, DEFAULT_MULTICHAIN_MODULE, ModuleInfo } from "@biconomy/modules";
import { Provider } from "@ethersproject/providers";
import { GasOverheads } from "./Preverificaiton";
import { UserOperation, ChainId } from "@biconomy/core-types";
import { WalletClientSigner } from "@alchemy/aa-core";

export type EntryPointAddresses = {
  [address: string]: string;
};

export type BiconomyFactories = {
  [address: string]: string;
};

export type BiconomyImplementations = {
  [address: string]: string;
};

export type EntryPointAddressesByVersion = {
  [version: string]: string;
};

export type BiconomyFactoriesByVersion = {
  [version: string]: string;
};

export type BiconomyImplementationsByVersion = {
  [version: string]: string;
};

export type SmartAccountConfig = {
  entryPointAddress: string;
  bundler?: IBundler;
};

/**
 * Enum representing available validation modules.
 *
 * - `ECDSA_OWNERSHIP`: Default module for ECDSA ownership validation.
 * - `MULTICHAIN`: Default module for multi-chain validation.
 * -  For SESSION MODULE or BATCHED SESSION please provide the module with "defaultValidationModule" in the config
 * -  If you don't provide any module, ECDSA_OWNERSHIP will be used as default
 */
export enum ValidationModule {
  ECDSA_OWNERSHIP = DEFAULT_ECDSA_OWNERSHIP_MODULE,
  MULTICHAIN = DEFAULT_MULTICHAIN_MODULE,
}

export interface BaseSmartAccountConfig {
  // owner?: Signer // can be in child classes
  index?: number;
  provider?: Provider;
  entryPointAddress: string;
  accountAddress?: string;
  overheads?: Partial<GasOverheads>;
  paymaster?: IPaymaster; // PaymasterAPI
  bundler?: IBundler; // like HttpRpcClient
  chainId: ChainId;
}

export type BiconomyTokenPaymasterRequest = {
  feeQuote: PaymasterFeeQuote;
  spender: string;
  maxApproval?: boolean;
};

export type BiconomySmartAccountConfig = {
  signer: Signer;
  rpcUrl?: string;
  chainId: ChainId;
  entryPointAddress?: string;
  bundler?: IBundler;
  paymaster?: IPaymaster;
  nodeClientUrl?: string;
};

export interface BiconomySmartAccountV2Config extends BaseSmartAccountConfig {
  factoryAddress?: string;
  senderAddress?: string;
  implementationAddress?: string;
  defaultFallbackHandler?: string;
  rpcUrl?: string; // as good as Provider
  signer: Signer | WalletClientSigner;
  nodeClientUrl?: string; // very specific to Biconomy
  module?: ValidationModule;
  defaultValidationModule?: BaseValidationModule;
  activeValidationModule?: BaseValidationModule;
  scanForUpgradedAccountsFromV1?: boolean;
  maxIndexForScan?: number;
}

export type BuildUserOpOptions = {
  overrides?: Overrides;
  skipBundlerGasEstimation?: boolean;
  params?: ModuleInfo;
  nonceOptions?: NonceOptions;
  forceEncodeForBatch?: boolean;
  paymasterServiceData?: SponsorUserOperationDto;
};

export type NonceOptions = {
  nonceKey?: number;
  nonceOverride?: number;
};

// Used in AccountV1
export type SendUserOpDto = {
  signer?: Signer;
  simulationType?: SimulationType;
};

// Generic options in AccountV2
export type SendUserOpOptions = {
  simulationType?: SimulationType;
};

export type SimulationType = "validation" | "validation_and_execution";

export type Overrides = {
  callGasLimit?: BigNumberish;
  verificationGasLimit?: BigNumberish;
  preVerificationGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  paymasterData?: string;
  signature?: string;
};

export type InitilizationData = {
  accountIndex?: number;
  signerAddress?: string;
};

export type InitializeV2Data = {
  accountIndex?: number;
};

export type EstimateUserOpGasParams = {
  userOp: Partial<UserOperation>;
  overrides?: Overrides;
  skipBundlerGasEstimation?: boolean;
  paymasterServiceData?: SponsorUserOperationDto;
};

export interface TransactionDetailsForUserOp {
  target: string;
  data: string;
  value?: BigNumberish;
  gasLimit?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  nonce?: BigNumberish;
}

export type CounterFactualAddressParam = {
  index?: number;
  validationModule?: BaseValidationModule;
  scanForUpgradedAccountsFromV1?: boolean;
  maxIndexForScan?: number;
};

export type QueryParamsForAddressResolver = {
  eoaAddress: string;
  index: number;
  moduleAddress: string;
  moduleSetupData: string;
  maxIndexForScan?: number;
};

export type SmartAccountInfo = {
  accountAddress: string;
  factoryAddress: string;
  currentImplementation: string;
  currentVersion: string;
  factoryVersion: string;
  deploymentIndex: BigNumber;
};
