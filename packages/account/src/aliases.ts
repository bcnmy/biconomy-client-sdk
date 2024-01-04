import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";
import { BiconomySmartAccountV2Config } from "./utils/Types";

export { BiconomyPaymaster as Paymaster, IPaymaster } from "@biconomy/paymaster";
export { Bundler, IBundler } from "@biconomy/bundler";
export const createSmartWalletClient = BiconomySmartAccountV2.create;
export type SmartWalletConfig = BiconomySmartAccountV2Config;
