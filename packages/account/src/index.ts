import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2.js";
import { type BiconomySmartAccountV2Config } from "./utils/Types.js";

export * from "./utils/Types.js";
export * from "./utils/Constants.js";
export * from "./BiconomySmartAccountV2.js";

export { WalletClientSigner, LocalAccountSigner, type SmartAccountSigner } from "@alchemy/aa-core";
export {
  BiconomyPaymaster as Paymaster,
  type IPaymaster,
  PaymasterMode,
  type IHybridPaymaster,
  type PaymasterFeeQuote,
  type SponsorUserOperationDto,
  type FeeQuotesOrDataResponse,
} from "@biconomy-devx/paymaster";
export { EthersSigner, convertSigner } from "@biconomy-devx/common";
export { Bundler, type IBundler, extractChainIdFromBundlerUrl, type UserOpResponse, type UserOpStatus, type UserOpReceipt } from "@biconomy-devx/bundler";
export {
  createECDSAOwnershipValidationModule,
  createERC20SessionValidationModule,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule,
  createMultiChainValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  DEFAULT_MULTICHAIN_MODULE,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
} from "@biconomy-devx/modules";

export const createSmartAccountClient = BiconomySmartAccountV2.create;

export type SmartWalletConfig = BiconomySmartAccountV2Config;
