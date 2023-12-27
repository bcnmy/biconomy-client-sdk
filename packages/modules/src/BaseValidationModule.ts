import { Hex } from "viem";
import { WalletClientSigner } from "@alchemy/aa-core";
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

  abstract getSigner(): Promise<WalletClientSigner>;

  // Signer specific or any other additional information can be passed as params
  abstract signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<Hex>;

  abstract signMessage(_message: Uint8Array | string): Promise<string>;
}
