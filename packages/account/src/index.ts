import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";
import { BiconomySmartAccountV2Config } from "./utils/Types";

export * from "./utils/Types";
export * from "./utils/Constants";
export * from "./BiconomySmartAccountV2";

export { LocalAccountSigner } from "@biconomy/common";
export { WalletClientSigner } from "@biconomy/common";
export { SmartAccountSigner } from "@biconomy/common";
export {
  BiconomyPaymaster as Paymaster,
  IPaymaster,
  PaymasterMode,
  IHybridPaymaster,
  PaymasterFeeQuote,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
export { EthersSigner, convertSigner } from "@biconomy/common";
export { Bundler, IBundler, extractChainIdFromBundlerUrl, UserOpResponse } from "@biconomy/bundler";

export const createSmartWalletClient = BiconomySmartAccountV2.create;

export type SmartWalletConfig = BiconomySmartAccountV2Config;
