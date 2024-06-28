import { NexusSmartAccount } from "./NexusSmartAccount.js"
import type { NexusSmartAccountConfig } from "./utils/Types.js"

export * from "./NexusSmartAccount.js"
export * from "./utils/index.js"
export * from "./signers/local-account.js"
export * from "./signers/wallet-client.js"

export const createSmartAccountClient = NexusSmartAccount.create

export type SmartWalletConfig = NexusSmartAccountConfig
