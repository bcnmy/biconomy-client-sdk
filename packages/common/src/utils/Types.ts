import { WalletClient } from "viem";
import { Signer } from "@ethersproject/abstract-signer";
import { SmartAccountSigner } from "@alchemy/aa-core";

export type SupportedSignerName = "alchemy" | "ethers" | "viem";
export type SupportedSigner = SmartAccountSigner | WalletClient | Signer | LightSigner;

export type Service = "Bundler" | "Paymaster";

export interface LightSigner {
  getAddress(): Promise<string>;
  signMessage(message: string | Uint8Array): Promise<string>;
}

export type StateOverrideSet = {
  [key: string]: {
    balance?: string;
    nonce?: string;
    code?: string;
    state?: object;
    stateDiff?: object;
  };
};
