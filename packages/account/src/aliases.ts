import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";
import { BiconomySmartAccountV2Config } from "./utils/Types";

export const createSmartWalletClient = BiconomySmartAccountV2.create;
export type SmartWalletConfig = BiconomySmartAccountV2Config;
