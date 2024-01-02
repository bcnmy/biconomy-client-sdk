import { WalletClientSigner } from "@alchemy/aa-core";
import { Signer } from "ethers";
import { Bytes } from "ethers/lib/utils";

export interface IValidationModule {
  getAddress(): string;
  getInitData(): Promise<string>;
  getSigner(): Promise<Signer | WalletClientSigner>;
  signUserOpHash(_userOpHash: string): Promise<string>;
  signMessage(_message: Bytes | string): Promise<string>;
  getDummySignature(): Promise<string>;
}
