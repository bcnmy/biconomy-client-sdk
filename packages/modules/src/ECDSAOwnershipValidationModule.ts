import { Hex, encodeFunctionData, getAddress, parseAbi, toBytes } from "viem";
import { SmartAccountSigner } from "@alchemy/aa-core";
import { ECDSAOwnershipValidationModuleConfig, ECDSAOwnershipValidationModuleConfigConstructorProps, ModuleVersion } from "./utils/Types";
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants";
import { BaseValidationModule } from "./BaseValidationModule";
import { convertSigner } from "@biconomy/common";

// Could be renamed with suffix API
export class ECDSAOwnershipValidationModule extends BaseValidationModule {
  signer: SmartAccountSigner;

  moduleAddress!: Hex;

  version: ModuleVersion = "V1_0_0";

  private constructor(moduleConfig: ECDSAOwnershipValidationModuleConfigConstructorProps) {
    super(moduleConfig);
    this.signer = moduleConfig.signer;
  }

  public static async create(moduleConfig: ECDSAOwnershipValidationModuleConfig): Promise<ECDSAOwnershipValidationModule> {
    // Signer needs to be initialised here before defaultValidationModule is set
    const { signer } = convertSigner(moduleConfig.signer);
    const configForConstructor: ECDSAOwnershipValidationModuleConfigConstructorProps = { ...moduleConfig, signer };

    // TODO: (Joe) stop doing things in a 'create' call after the instance has been created
    const instance = new ECDSAOwnershipValidationModule(configForConstructor);
    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress;
    } else if (moduleConfig.version) {
      const moduleAddr = ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version] as Hex;
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`);
      }
      instance.moduleAddress = moduleAddr;
      instance.version = moduleConfig.version as ModuleVersion;
    } else {
      instance.moduleAddress = DEFAULT_ECDSA_OWNERSHIP_MODULE;
      // Note: in this case Version remains the default one
    }
    return instance;
  }

  getAddress(): Hex {
    return this.moduleAddress;
  }

  async getSigner(): Promise<SmartAccountSigner> {
    return Promise.resolve(this.signer);
  }

  async getDummySignature(): Promise<Hex> {
    const moduleAddress = getAddress(this.getAddress());
    const dynamicPart = moduleAddress.substring(2).padEnd(40, "0");
    return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`;
  }

  // Note: other modules may need additional attributes to build init data
  async getInitData(): Promise<Hex> {
    const ecdsaOwnerAddress = await this.signer.getAddress();
    const moduleRegistryParsedAbi = parseAbi(["function initForSmartAccount(address owner)"]);
    const ecdsaOwnershipInitData = encodeFunctionData({
      abi: moduleRegistryParsedAbi,
      functionName: "initForSmartAccount",
      args: [ecdsaOwnerAddress],
    });
    return ecdsaOwnershipInitData;
  }

  async signUserOpHash(userOpHash: string): Promise<Hex> {
    const sig = await this.signer.signMessage(toBytes(userOpHash));
    return sig;
  }

  /**
   * Signs a message using the appropriate method based on the type of signer.
   *
   * @param {Uint8Array | string} message - The message to be signed.
   * @returns {Promise<string>} A promise resolving to the signature or error message.
   * @throws {Error} If the signer type is invalid or unsupported.
   */
  async signMessage(message: Uint8Array | string): Promise<string> {
    let signature = await this.signer.signMessage(message);

    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = signature.slice(0, -2) + correctV.toString(16);
    }
    return signature;
  }
}
