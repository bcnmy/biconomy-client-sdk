import { SmartAccountSigner } from "../aa-core/signer/types";
import { WalletClient } from "viem";
import { Signer } from "@ethersproject/abstract-signer";

export type SupportedSignerName = "alchemy" | "ethers" | "viem";
export type SupportedSigner = SmartAccountSigner | WalletClient | Signer | EthersV6Signer;

export interface EthersV6Signer {
  getAddress(): Promise<string>;
  // eslint-disable-next-line no-unused-vars
  signMessage(message: string | Uint8Array): Promise<string>;
}
