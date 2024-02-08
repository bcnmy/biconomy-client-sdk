import { WalletClient } from "viem";
import { Signer } from "@ethersproject/abstract-signer";
import { SmartAccountSigner } from "@alchemy/aa-core";

export type SupportedSignerName = "alchemy" | "ethers" | "viem";
export type SupportedSigner = SmartAccountSigner | WalletClient | Signer | EthersV6Signer;

export type Service = "Bundler" | "Paymaster";

export interface EthersV6Signer {
  getAddress(): Promise<string>;
  signMessage(message: string | Uint8Array): Promise<string>;
}
