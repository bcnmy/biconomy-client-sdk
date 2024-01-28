import { Hex } from "viem";
import { SmartAccountSigner } from "@biconomy-devx/common";
import { BaseValidationModuleConfig, ModuleInfo } from "./utils/Types";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "./utils/Constants";
import { IValidationModule } from "./interfaces/IValidationModule";

export abstract class BaseValidationModule implements IValidationModule {
  entryPointAddress: Hex;

  constructor(moduleConfig: BaseValidationModuleConfig) {
    const { entryPointAddress } = moduleConfig;

    this.entryPointAddress = entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS;
  }

  abstract getAddress(): Hex;

  setEntryPointAddress(entryPointAddress: Hex): void {
    this.entryPointAddress = entryPointAddress;
  }

  abstract getInitData(): Promise<Hex>;

  // Anything  required to get dummy signature can be passed as params
  abstract getDummySignature(_params?: ModuleInfo): Promise<Hex>;

  abstract getSigner(): Promise<SmartAccountSigner>;

  // Signer specific or any other additional information can be passed as params
  abstract signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<Hex>;

  abstract signMessage(_message: Uint8Array | string): Promise<string>;

  async signMessageSmartAccountSigner(message: string | Uint8Array, signer: SmartAccountSigner): Promise<string> {
    let signature: `0x${string}` = await signer.signMessage(message);

    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = `0x${signature.slice(0, -2) + correctV.toString(16)}`;
    }

    return signature;
  }
}
