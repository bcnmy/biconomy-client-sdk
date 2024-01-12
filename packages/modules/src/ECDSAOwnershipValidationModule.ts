import { Logger } from "@biconomy-devx/common";
import { Signer, ethers } from "ethers";
import { Bytes, arrayify } from "ethers/lib/utils";
import { ECDSAOwnershipValidationModuleConfig, ModuleVersion } from "./utils/Types";
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants";
import { BaseValidationModule } from "./BaseValidationModule";
import { WalletClientSigner } from "@alchemy/aa-core";

// Could be renamed with suffix API
export class ECDSAOwnershipValidationModule extends BaseValidationModule {
  signer!: Signer | WalletClientSigner;

  moduleAddress!: string;

  version: ModuleVersion = "V1_0_0";

  private constructor(moduleConfig: ECDSAOwnershipValidationModuleConfig) {
    super(moduleConfig);
  }

  public static async create(moduleConfig: ECDSAOwnershipValidationModuleConfig): Promise<ECDSAOwnershipValidationModule> {
    const instance = new ECDSAOwnershipValidationModule(moduleConfig);
    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress;
    } else if (moduleConfig.version) {
      const moduleAddr = ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`);
      }
      instance.moduleAddress = moduleAddr;
      instance.version = moduleConfig.version as ModuleVersion;
    } else {
      instance.moduleAddress = DEFAULT_ECDSA_OWNERSHIP_MODULE;
      // Note: in this case Version remains the default one
    }
    instance.signer = moduleConfig.signer;
    return instance;
  }

  getAddress(): string {
    return this.moduleAddress;
  }

  async getSigner(): Promise<Signer | WalletClientSigner> {
    return Promise.resolve(this.signer);
  }

  async getDummySignature(): Promise<string> {
    const moduleAddress = ethers.utils.getAddress(this.getAddress());
    const dynamicPart = moduleAddress.substring(2).padEnd(40, "0");
    return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`;
  }

  // Note: other modules may need additional attributes to build init data
  async getInitData(): Promise<string> {
    const ecdsaOwnerAddress = await this.signer.getAddress();
    const moduleRegistryAbi = "function initForSmartAccount(address owner)";
    const ecdsaModuleRegistryInterface = new ethers.utils.Interface([moduleRegistryAbi]);
    const ecdsaOwnershipInitData = ecdsaModuleRegistryInterface.encodeFunctionData("initForSmartAccount", [ecdsaOwnerAddress]);
    return ecdsaOwnershipInitData;
  }

  async signUserOpHash(userOpHash: string): Promise<string> {
    const sig = await this.signer.signMessage(arrayify(userOpHash));

    Logger.log("ecdsa signature ", sig);

    return sig;
  }

  /**
   * Signs a message using the appropriate method based on the type of signer.
   *
   * @param {Bytes | string | Uint8Array} message - The message to be signed.
   * @returns {Promise<string>} A promise resolving to the signature or error message.
   * @throws {Error} If the signer type is invalid or unsupported.
   */
  async signMessage(message: Bytes | string | Uint8Array): Promise<string> {
    if (this.signer instanceof WalletClientSigner) {
      return super.signMessageWalletClientSigner(message as Uint8Array | string, this.signer as WalletClientSigner);
    } else if (this.signer instanceof Signer) {
      return super.signMessageSigner(message as Bytes | string, this.signer as Signer);
    } else {
      throw new Error("Invalid signer type");
    }
  }
}
