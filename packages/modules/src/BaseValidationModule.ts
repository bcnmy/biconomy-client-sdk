import { Signer } from "ethers";
import { Bytes } from "ethers/lib/utils";
import { BaseValidationModuleConfig, ModuleInfo } from "./utils/Types";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "./utils/Constants";
import { IValidationModule } from "./interfaces/IValidationModule";

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

  abstract getSigner(): Promise<Signer>;

  // Signer specific or any other additional information can be passed as params
  abstract signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<string>;

  abstract signMessage(_message: Bytes | string): Promise<string>;
}
