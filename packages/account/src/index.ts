import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";
import { BiconomySmartAccountV2Config } from "./utils/Types";

export * from "./utils/Types";
export * from "./utils/Constants";
export * from "./BiconomySmartAccountV2";
export * from "./provider";

export { WalletClientSigner, LocalAccountSigner, SmartAccountSigner } from "@alchemy/aa-core";
export { BiconomyPaymaster as Paymaster, IPaymaster, PaymasterMode } from "@biconomy/paymaster";
export { EthersSigner, convertSigner } from "@biconomy/common";
export { Bundler, IBundler } from "@biconomy/bundler";

export const createSmartWalletClient = BiconomySmartAccountV2.create;

export type SmartWalletConfig = BiconomySmartAccountV2Config;
