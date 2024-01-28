import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";
import { BiconomySmartAccountV2Config } from "./utils/Types";

export * from "./utils/Types";
export * from "./utils/Constants";
export * from "./BiconomySmartAccountV2";

export { LocalAccountSigner } from "@biconomy-devx/common";
export { WalletClientSigner } from "@biconomy-devx/common";
export { SmartAccountSigner } from "@biconomy-devx/common";
export {
  BiconomyPaymaster as Paymaster,
  IPaymaster,
  PaymasterMode,
  IHybridPaymaster,
  PaymasterFeeQuote,
  SponsorUserOperationDto,
  FeeQuotesOrDataResponse,
} from "@biconomy-devx/paymaster";
export { EthersSigner, convertSigner } from "@biconomy-devx/common";
export { Bundler, IBundler, extractChainIdFromBundlerUrl, UserOpResponse } from "@biconomy-devx/bundler";

export const createSmartAccountClient = BiconomySmartAccountV2.create;

export type SmartWalletConfig = BiconomySmartAccountV2Config;
