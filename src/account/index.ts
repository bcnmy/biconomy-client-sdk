import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2.js"
import type { BiconomySmartAccountV2Config } from "./utils/Types.js"

export * from "./utils/index.js"
export * from "./signers/local-account.js"
export * from "./signers/wallet-client.js"
export * from "./BiconomySmartAccountV2.js"

export const createSmartAccountClient = BiconomySmartAccountV2.create

export type SmartWalletConfig = BiconomySmartAccountV2Config
