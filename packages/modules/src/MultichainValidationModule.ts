import { Hex, concat, encodeAbiParameters, encodeFunctionData, getAddress, keccak256, pad, parseAbi, parseAbiParameters, toBytes, toHex } from "viem";
import { UserOperationStruct, SmartAccountSigner } from "@alchemy/aa-core";
import MerkleTree from "merkletreejs";
import { DEFAULT_MULTICHAIN_MODULE, MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants";
import {
  ModuleVersion,
  MultiChainUserOpDto,
  MultiChainValidationModuleConfig,
  MultiChainValidationModuleConfigConstructorProps,
} from "./utils/Types";
import { BaseValidationModule } from "./BaseValidationModule";
import { getUserOpHash } from "./utils/Helper";
import { Logger } from "./utils/Logger";
import { convertSigner } from "@biconomy/common";

export class MultiChainValidationModule extends BaseValidationModule {
  signer: SmartAccountSigner;

  moduleAddress!: Hex;

  version: ModuleVersion = "V1_0_0";

  private constructor(moduleConfig: MultiChainValidationModuleConfigConstructorProps) {
    super(moduleConfig);
    this.signer = moduleConfig.signer;
  }

  public static async create(moduleConfig: MultiChainValidationModuleConfig): Promise<MultiChainValidationModule> {
    // Signer needs to be initialised here before defaultValidationModule is set
    const { signer } = await convertSigner(moduleConfig.signer, true);
    const configForConstructor: MultiChainValidationModuleConfigConstructorProps = { ...moduleConfig, signer };

    // TODO: (Joe) stop doing things in a 'create' call after the instance has been created
    const instance = new MultiChainValidationModule(configForConstructor);
    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress;
    } else if (moduleConfig.version) {
      const moduleAddr = MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version] as Hex;
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`);
      }
      instance.moduleAddress = moduleAddr;
      instance.version = moduleConfig.version as ModuleVersion;
    } else {
      instance.moduleAddress = DEFAULT_MULTICHAIN_MODULE;
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

  async signUserOps(multiChainUserOps: MultiChainUserOpDto[]): Promise<UserOperationStruct[]> {
    try {
      const leaves: string[] = [];

      // Iterate over each userOp and process them
      for (const multiChainOp of multiChainUserOps) {
        const validUntil = multiChainOp.validUntil ?? 0;
        const validAfter = multiChainOp.validAfter ?? 0;
        const leaf = concat([
          pad(toHex(validUntil), { size: 6 }),
          pad(toHex(validAfter), { size: 6 }),
          pad(getUserOpHash(multiChainOp.userOp, this.entryPointAddress, multiChainOp.chainId), { size: 32 }),
        ]);

        leaves.push(keccak256(leaf));
      }

      // Create a new Merkle tree using the leaves array
      const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      let multichainSignature = await this.signer.signMessage(toBytes(merkleTree.getHexRoot()));

      const potentiallyIncorrectV = parseInt(multichainSignature.slice(-2), 16);
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27;
        multichainSignature = multichainSignature.slice(0, -2) + correctV.toString(16);
      }

      // Create an array to store updated userOps
      const updatedUserOps: UserOperationStruct[] = [];

      for (let i = 0; i < leaves.length; i++) {
        const merkleProof = merkleTree.getHexProof(leaves[i]);

        const validUntil = multiChainUserOps[i].validUntil ?? 0;
        const validAfter = multiChainUserOps[i].validAfter ?? 0;

        // Create the moduleSignature
        const moduleSignature = encodeAbiParameters(parseAbiParameters(["uint48, uint48, bytes32, bytes32[], bytes"]), [
          validUntil,
          validAfter,
          merkleTree.getHexRoot() as Hex,
          merkleProof as Hex[],
          multichainSignature as Hex,
        ]);

        // Note: Because accountV2 does not directly call this method. hence we need to add validation module address to the signature
        const signatureWithModuleAddress = encodeAbiParameters(parseAbiParameters(["bytes, address"]), [moduleSignature, this.getAddress()]);

        // Update userOp with the final signature
        const updatedUserOp: UserOperationStruct = {
          ...(multiChainUserOps[i].userOp as UserOperationStruct),
          signature: signatureWithModuleAddress as `0x${string}`,
        };

        updatedUserOps.push(updatedUserOp);
      }
      return updatedUserOps;
    } catch (error) {
      Logger.error("Error in signing multi chain userops");
      throw new Error(JSON.stringify(error));
    }
  }
}
