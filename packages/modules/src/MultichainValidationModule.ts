import { UserOperation } from "@biconomy/core-types";
import { Logger, getUserOpHash } from "@biconomy/common";
import { Signer, ethers } from "ethers";
import MerkleTree from "merkletreejs";
import { DEFAULT_MULTICHAIN_MODULE, MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants";
import { keccak256, arrayify, defaultAbiCoder, hexConcat, hexZeroPad, Bytes } from "ethers/lib/utils";
import { ModuleVersion, MultiChainUserOpDto, MultiChainValidationModuleConfig } from "./utils/Types";
import { BaseValidationModule } from "./BaseValidationModule";
export class MultiChainValidationModule extends BaseValidationModule {
  signer: Signer;

  moduleAddress!: string;

  version: ModuleVersion = "V1_0_0";

  constructor(moduleConfig: MultiChainValidationModuleConfig) {
    super(moduleConfig);
    if (moduleConfig.moduleAddress) {
      this.moduleAddress = moduleConfig.moduleAddress;
    } else if (moduleConfig.version) {
      const moduleAddr = MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`);
      }
      this.moduleAddress = moduleAddr;
      this.version = moduleConfig.version as ModuleVersion;
    } else {
      this.moduleAddress = DEFAULT_MULTICHAIN_MODULE;
      // Note: in this case Version remains the default one
    }
    this.signer = moduleConfig.signer;
  }

  getAddress(): string {
    return this.moduleAddress;
  }

  async getSigner(): Promise<Signer> {
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

  async signMessage(message: Bytes | string): Promise<string> {
    return this.signer.signMessage(message);
  }

  async signUserOps(multiChainUserOps: MultiChainUserOpDto[]): Promise<UserOperation[]> {
    try {
      const leaves: string[] = [];

      // Iterate over each userOp and process them
      for (const multiChainOp of multiChainUserOps) {
        const validUntil = multiChainOp.validUntil ?? 0;
        const validAfter = multiChainOp.validAfter ?? 0;
        const leaf = hexConcat([
          hexZeroPad(ethers.utils.hexlify(validUntil), 6),
          hexZeroPad(ethers.utils.hexlify(validAfter), 6),
          hexZeroPad(getUserOpHash(multiChainOp.userOp, this.entryPointAddress, multiChainOp.chainId), 32),
        ]);

        leaves.push(keccak256(leaf));
      }

      // Create a new Merkle tree using the leaves array
      const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      const multichainSignature = await this.signer.signMessage(arrayify(merkleTree.getHexRoot()));

      // Create an array to store updated userOps
      const updatedUserOps: UserOperation[] = [];

      Logger.log("merkle root ", merkleTree.getHexRoot());

      for (let i = 0; i < leaves.length; i++) {
        const merkleProof = merkleTree.getHexProof(leaves[i]);

        Logger.log("merkle proof ", merkleProof);

        const validUntil = multiChainUserOps[i].validUntil ?? 0;
        const validAfter = multiChainUserOps[i].validAfter ?? 0;

        // Create the moduleSignature
        const moduleSignature = defaultAbiCoder.encode(
          ["uint48", "uint48", "bytes32", "bytes32[]", "bytes"],
          [validUntil, validAfter, merkleTree.getHexRoot(), merkleProof, multichainSignature],
        );

        // add validation module address to the signature
        // Note: because accountV2 does not directly call this method.
        const signatureWithModuleAddress = defaultAbiCoder.encode(["bytes", "address"], [moduleSignature, this.getAddress()]);

        // Update userOp with the final signature
        const updatedUserOp: UserOperation = {
          ...(multiChainUserOps[i].userOp as UserOperation),
          signature: signatureWithModuleAddress,
        };

        updatedUserOps.push(updatedUserOp);
      }
      return updatedUserOps;
    } catch (error) {
      Logger.error("Error in signing multi chain userops", error);
      throw new Error(JSON.stringify(error));
    }
  }
}
