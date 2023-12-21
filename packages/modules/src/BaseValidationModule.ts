import { Signer } from "ethers";
import { Bytes } from "ethers/lib/utils";
import { BaseValidationModuleConfig, ModuleInfo } from "./utils/Types";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "./utils/Constants";
import { IValidationModule } from "./interfaces/IValidationModule";
import { WalletClientSigner } from "@alchemy/aa-core";

export abstract class BaseValidationModule implements IValidationModule {
  entryPointAddress: string;

  constructor(moduleConfig: BaseValidationModuleConfig) {
    const { entryPointAddress } = moduleConfig;

    this.entryPointAddress = entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS;
  }

  abstract getAddress(): string;

  setEntryPointAddress(entryPointAddress: string): void {
    this.entryPointAddress = entryPointAddress;
  }

  abstract getInitData(): Promise<string>;

  // Anything  required to get dummy signature can be passed as params
  abstract getDummySignature(_params?: ModuleInfo): Promise<string>;

  abstract getSigner(): Promise<Signer | WalletClientSigner>;

  // Signer specific or any other additional information can be passed as params
  abstract signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<string>;

  abstract signMessage(_message: Bytes | string | Uint8Array): Promise<string>;

  async signMessageWalletClientSigner(message: string | Uint8Array, signer: WalletClientSigner): Promise<string> {
    let signature: `0x${string}` = await signer.signMessage(message);

    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = `0x${signature.slice(0, -2) + correctV.toString(16)}`;
    }

    return signature;
  }

  async signMessageSigner(message: Bytes | string, signer: Signer): Promise<string> {
    let signature = await signer.signMessage(message);

    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = signature.slice(0, -2) + correctV.toString(16);
    }

    return signature;
  }
}
