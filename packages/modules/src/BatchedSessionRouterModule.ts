import { Signer, ethers } from "ethers";
import { Logger } from "@biconomy/common";
import { hexConcat, arrayify, hexZeroPad, defaultAbiCoder, Bytes } from "ethers/lib/utils";
import { ModuleVersion, CreateSessionDataParams, BatchedSessionRouterModuleConfig, ModuleInfo, CreateSessionDataResponse } from "./utils/Types";
import {
  BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
} from "./utils/Constants";
import { BaseValidationModule } from "./BaseValidationModule";
import { SessionKeyManagerModule } from "./SessionKeyManagerModule";
import { SessionSearchParam, SessionStatus } from "./interfaces/ISessionStorage";

export class BatchedSessionRouterModule extends BaseValidationModule {
  version: ModuleVersion = "V1_0_0";

  moduleAddress!: string;

  sessionManagerModuleAddress!: string;

  sessionKeyManagerModule!: SessionKeyManagerModule;

  readonly mockEcdsaSessionKeySig: string =
    "0x73c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b";

  /**
   * This constructor is private. Use the static create method to instantiate SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns An instance of SessionKeyManagerModule
   */
  private constructor(moduleConfig: BatchedSessionRouterModuleConfig) {
    super(moduleConfig);
  }

  /**
   * Asynchronously creates and initializes an instance of SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns A Promise that resolves to an instance of SessionKeyManagerModule
   */
  public static async create(moduleConfig: BatchedSessionRouterModuleConfig): Promise<BatchedSessionRouterModule> {
    const instance = new BatchedSessionRouterModule(moduleConfig);

    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress;
    } else if (moduleConfig.version) {
      const moduleAddr = BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`);
      }
      instance.moduleAddress = moduleAddr;
      instance.version = moduleConfig.version as ModuleVersion;
    } else {
      instance.moduleAddress = DEFAULT_BATCHED_SESSION_ROUTER_MODULE;
      // Note: in this case Version remains the default one
    }

    instance.sessionManagerModuleAddress = moduleConfig.sessionManagerModuleAddress ?? DEFAULT_SESSION_KEY_MANAGER_MODULE;

    if (!moduleConfig.sessionKeyManagerModule) {
      // generate sessionModule
      const sessionModule = await SessionKeyManagerModule.create({
        moduleAddress: instance.sessionManagerModuleAddress,
        smartAccountAddress: moduleConfig.smartAccountAddress,
        nodeClientUrl: moduleConfig.nodeClientUrl,
        storageType: moduleConfig.storageType,
      });

      instance.sessionKeyManagerModule = sessionModule;
    } else {
      instance.sessionKeyManagerModule = moduleConfig.sessionKeyManagerModule;
      instance.sessionManagerModuleAddress = moduleConfig.sessionKeyManagerModule.getAddress();
    }

    return instance;
  }

  /**
   * Method to create session data for any module. The session data is used to create a leaf in the merkle tree
   * @param leavesData The data of one or more leaves to be used to create session data
   * @returns The session data
   */
  createSessionData = async (leavesData: CreateSessionDataParams[]): Promise<CreateSessionDataResponse> => {
    return this.sessionKeyManagerModule.createSessionData(leavesData);
  };

  /**
   * This method is used to sign the user operation using the session signer
   * @param userOp The user operation to be signed
   * @param sessionParams Information about all the sessions to be used to sign the user operation which has a batch execution
   * @returns The signature of the user operation
   */
  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string> {
    const sessionParams = params?.batchSessionParams;
    if (!sessionParams || sessionParams.length === 0) {
      throw new Error("Session parameters are not provided");
    }

    const sessionDataTupleArray = [];

    // signer must be the same for all the sessions
    const sessionSigner = sessionParams[0].sessionSigner;

    const signature = await sessionSigner.signMessage(arrayify(userOpHash));

    for (const sessionParam of sessionParams) {
      if (!sessionParam.sessionSigner) {
        throw new Error("Session signer is not provided.");
      }

      const sessionDataTuple = [];

      let sessionSignerData;

      if (sessionParam.sessionID) {
        sessionSignerData = await this.sessionKeyManagerModule.sessionStorageClient.getSessionData({
          sessionID: sessionParam.sessionID,
        });
      } else if (sessionParam.sessionValidationModule) {
        sessionSignerData = await this.sessionKeyManagerModule.sessionStorageClient.getSessionData({
          sessionValidationModule: sessionParam.sessionValidationModule,
          sessionPublicKey: await sessionSigner.getAddress(),
        });
      } else {
        throw new Error("sessionID or sessionValidationModule should be provided.");
      }

      sessionDataTuple.push(sessionSignerData.validUntil);
      sessionDataTuple.push(sessionSignerData.validAfter);
      sessionDataTuple.push(sessionSignerData.sessionValidationModule);
      sessionDataTuple.push(sessionSignerData.sessionKeyData);

      const leafDataHex = hexConcat([
        hexZeroPad(ethers.utils.hexlify(sessionSignerData.validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(sessionSignerData.validAfter), 6),
        hexZeroPad(sessionSignerData.sessionValidationModule, 20),
        sessionSignerData.sessionKeyData,
      ]);

      const proof = this.sessionKeyManagerModule.merkleTree.getHexProof(ethers.utils.keccak256(leafDataHex) as unknown as Buffer);

      sessionDataTuple.push(proof);
      sessionDataTuple.push(sessionParam.additionalSessionData ?? "0x");

      sessionDataTupleArray.push(sessionDataTuple);
    }

    // Generate the padded signature

    const paddedSignature = defaultAbiCoder.encode(
      ["address", "tuple(uint48,uint48,address,bytes,bytes32[],bytes)[]", "bytes"],
      [this.getSessionKeyManagerAddress(), sessionDataTupleArray, signature],
    );

    return paddedSignature;
  }

  /**
   * Update the session data pending state to active
   * @param param The search param to find the session data
   * @param status The status to be updated
   * @returns
   */
  async updateSessionStatus(param: SessionSearchParam, status: SessionStatus): Promise<void> {
    this.sessionKeyManagerModule.sessionStorageClient.updateSessionStatus(param, status);
  }

  /**
   * @remarks This method is used to clear all the pending sessions
   * @returns
   */
  async clearPendingSessions(): Promise<void> {
    this.sessionKeyManagerModule.sessionStorageClient.clearPendingSessions();
  }

  /**
   * @returns SessionKeyManagerModule address
   */
  getAddress(): string {
    return this.moduleAddress;
  }

  /**
   * @returns SessionKeyManagerModule address
   */
  getSessionKeyManagerAddress(): string {
    return this.sessionManagerModuleAddress;
  }

  /**
   * @remarks This is the version of the module contract
   */
  async getSigner(): Promise<Signer> {
    throw new Error("Method not implemented.");
  }

  /**
   * @remarks This is the dummy signature for the module, used in buildUserOp for bundler estimation
   * @returns Dummy signature
   */
  async getDummySignature(params?: ModuleInfo): Promise<string> {
    const sessionParams = params?.batchSessionParams;
    if (!sessionParams || sessionParams.length === 0) {
      throw new Error("Session parameters are not provided");
    }

    const sessionDataTupleArray = [];

    // if needed we could do mock signature over userOpHashAndModuleAddress

    // signer must be the same for all the sessions
    const sessionSigner = sessionParams[0].sessionSigner;

    for (const sessionParam of sessionParams) {
      if (!sessionParam.sessionSigner) {
        throw new Error("Session signer is not provided.");
      }

      const sessionDataTuple = [];

      let sessionSignerData;

      if (sessionParam.sessionID) {
        sessionSignerData = await this.sessionKeyManagerModule.sessionStorageClient.getSessionData({
          sessionID: sessionParam.sessionID,
        });
      } else if (sessionParam.sessionValidationModule) {
        sessionSignerData = await this.sessionKeyManagerModule.sessionStorageClient.getSessionData({
          sessionValidationModule: sessionParam.sessionValidationModule,
          sessionPublicKey: await sessionSigner.getAddress(),
        });
      } else {
        throw new Error("sessionID or sessionValidationModule should be provided.");
      }

      sessionDataTuple.push(sessionSignerData.validUntil);
      sessionDataTuple.push(sessionSignerData.validAfter);
      sessionDataTuple.push(sessionSignerData.sessionValidationModule);
      sessionDataTuple.push(sessionSignerData.sessionKeyData);

      const leafDataHex = hexConcat([
        hexZeroPad(ethers.utils.hexlify(sessionSignerData.validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(sessionSignerData.validAfter), 6),
        hexZeroPad(sessionSignerData.sessionValidationModule, 20),
        sessionSignerData.sessionKeyData,
      ]);

      const proof = this.sessionKeyManagerModule.merkleTree.getHexProof(ethers.utils.keccak256(leafDataHex) as unknown as Buffer);

      sessionDataTuple.push(proof);
      sessionDataTuple.push(sessionParam.additionalSessionData ?? "0x");

      sessionDataTupleArray.push(sessionDataTuple);
    }

    // Generate the padded signature

    const paddedSignature = defaultAbiCoder.encode(
      ["address", "tuple(uint48,uint48,address,bytes,bytes32[],bytes)[]", "bytes"],
      [this.getSessionKeyManagerAddress(), sessionDataTupleArray, this.mockEcdsaSessionKeySig],
    );

    const dummySig = ethers.utils.defaultAbiCoder.encode(["bytes", "address"], [paddedSignature, this.getAddress()]);

    return dummySig;
  }

  /**
   * @remarks Other modules may need additional attributes to build init data
   */
  async getInitData(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  /**
   * @remarks This Module dont have knowledge of signer. So, this method is not implemented
   */
  async signMessage(message: Bytes | string): Promise<string> {
    Logger.log("message", message);
    throw new Error("Method not implemented.");
  }
}
