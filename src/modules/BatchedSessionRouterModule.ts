import {
  type Hex,
  concat,
  encodeAbiParameters,
  keccak256,
  pad,
  parseAbiParameters,
  toBytes,
  toHex,
} from "viem";
import { type SmartAccountSigner, convertSigner } from "../account";
import { BaseValidationModule } from "./BaseValidationModule.js";
import { SessionKeyManagerModule } from "./SessionKeyManagerModule.js";
import type {
  SessionSearchParam,
  SessionStatus,
} from "./interfaces/ISessionStorage.js";
import {
  BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
} from "./utils/Constants.js";
// @ts-nocheck
import type {
  BatchedSessionRouterModuleConfig,
  CreateSessionDataParams,
  CreateSessionDataResponse,
  ModuleInfo,
  ModuleVersion,
  SessionDataTuple,
} from "./utils/Types.js";

export class BatchedSessionRouterModule extends BaseValidationModule {
  version: ModuleVersion = "V1_0_0";

  moduleAddress!: Hex;

  sessionManagerModuleAddress!: Hex;

  sessionKeyManagerModule!: SessionKeyManagerModule;

  readonly mockEcdsaSessionKeySig: Hex =
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
  public static async create(
    moduleConfig: BatchedSessionRouterModuleConfig,
  ): Promise<BatchedSessionRouterModule> {
    const instance = new BatchedSessionRouterModule(moduleConfig);

    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress;
    } else if (moduleConfig.version) {
      const moduleAddr = BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION[
        moduleConfig.version
      ] as Hex;
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`);
      }
      instance.moduleAddress = moduleAddr;
      instance.version = moduleConfig.version as ModuleVersion;
    } else {
      instance.moduleAddress = DEFAULT_BATCHED_SESSION_ROUTER_MODULE;
      // Note: in this case Version remains the default one
    }

    instance.sessionManagerModuleAddress =
      moduleConfig.sessionManagerModuleAddress ??
      DEFAULT_SESSION_KEY_MANAGER_MODULE;

    if (!moduleConfig.sessionKeyManagerModule) {
      // generate sessionModule
      const sessionModule = await SessionKeyManagerModule.create({
        moduleAddress: instance.sessionManagerModuleAddress,
        smartAccountAddress: moduleConfig.smartAccountAddress,
        storageType: moduleConfig.storageType,
      });

      instance.sessionKeyManagerModule = sessionModule;
    } else {
      instance.sessionKeyManagerModule = moduleConfig.sessionKeyManagerModule;
      instance.sessionManagerModuleAddress =
        moduleConfig.sessionKeyManagerModule.getAddress();
    }

    return instance;
  }

  /**
   * Method to create session data for any module. The session data is used to create a leaf in the merkle tree
   * @param leavesData The data of one or more leaves to be used to create session data
   * @returns The session data
   */
  createSessionData = async (
    leavesData: CreateSessionDataParams[],
  ): Promise<CreateSessionDataResponse> => {
    return this.sessionKeyManagerModule.createSessionData(leavesData);
  };

  /**
   * This method is used to sign the user operation using the session signer
   * @param userOp The user operation to be signed
   * @param sessionParams Information about all the sessions to be used to sign the user operation which has a batch execution
   * @returns The signature of the user operation
   */
  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<Hex> {
    const sessionParams = params?.batchSessionParams;
    if (!sessionParams || sessionParams.length === 0) {
      throw new Error("Session parameters are not provided");
    }

    const sessionDataTupleArray: SessionDataTuple[] = [];

    // signer must be the same for all the sessions
    const { signer: sessionSigner } = await convertSigner(
      sessionParams[0].sessionSigner,
      false,
    );

    const signature = await sessionSigner.signMessage({
      raw: toBytes(userOpHash),
    });

    for (const sessionParam of sessionParams) {
      if (!sessionParam.sessionSigner) {
        throw new Error("Session signer is not provided.");
      }
      if (!sessionParam.sessionID && !sessionParam.sessionValidationModule) {
        throw new Error(
          "sessionID or sessionValidationModule should be provided.",
        );
      }

      const sessionSignerData =
        await this.sessionKeyManagerModule.sessionStorageClient.getSessionData(
          sessionParam.sessionID
            ? {
                sessionID: sessionParam.sessionID,
              }
            : {
                sessionValidationModule: sessionParam.sessionValidationModule,
                sessionPublicKey: await sessionSigner.getAddress(),
              },
        );

      const leafDataHex = concat([
        pad(toHex(sessionSignerData.validUntil), { size: 6 }),
        pad(toHex(sessionSignerData.validAfter), { size: 6 }),
        pad(sessionSignerData.sessionValidationModule, { size: 20 }),
        sessionSignerData.sessionKeyData,
      ]);

      const proof = this.sessionKeyManagerModule.merkleTree.getHexProof(
        keccak256(leafDataHex),
      );

      const sessionDataTuple: SessionDataTuple = [
        sessionSignerData.validUntil,
        sessionSignerData.validAfter,
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        proof,
        sessionParam.additionalSessionData ?? "0x",
      ];

      sessionDataTupleArray.push(sessionDataTuple);
    }

    // Generate the padded signature
    const abiParameters = [
      { type: "address" },
      {
        type: "tuple[]",
        components: [
          { type: "uint48" },
          { type: "uint48" },
          { type: "address" },
          { type: "bytes" },
          { type: "bytes32[]" },
          { type: "bytes" },
        ],
      },
      { type: "bytes" },
    ];

    const paddedSignature = encodeAbiParameters(abiParameters, [
      this.getSessionKeyManagerAddress(),
      sessionDataTupleArray,
      signature,
    ]);

    return paddedSignature as Hex;
  }

  /**
   * Update the session data pending state to active
   * @param param The search param to find the session data
   * @param status The status to be updated
   * @returns
   */
  async updateSessionStatus(
    param: SessionSearchParam,
    status: SessionStatus,
  ): Promise<void> {
    this.sessionKeyManagerModule.sessionStorageClient.updateSessionStatus(
      param,
      status,
    );
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
  getAddress(): Hex {
    return this.moduleAddress;
  }

  /**
   * @returns SessionKeyManagerModule address
   */
  getSessionKeyManagerAddress(): Hex {
    return this.sessionManagerModuleAddress;
  }

  /**
   * @remarks This is the version of the module contract
   */
  async getSigner(): Promise<SmartAccountSigner> {
    throw new Error("Method not implemented.");
  }

  /**
   * @remarks This is the dummy signature for the module, used in buildUserOp for bundler estimation
   * @returns Dummy signature
   */
  async getDummySignature(params?: ModuleInfo): Promise<Hex> {
    const sessionParams = params?.batchSessionParams;
    if (!sessionParams || sessionParams.length === 0) {
      throw new Error("Session parameters are not provided");
    }

    const sessionDataTupleArray: SessionDataTuple[] = [];
    // signer must be the same for all the sessions
    const { signer: sessionSigner } = await convertSigner(
      sessionParams[0].sessionSigner,
      false,
    );

    for (const sessionParam of sessionParams) {
      if (!sessionParam.sessionSigner) {
        throw new Error("Session signer is not provided.");
      }

      if (!sessionParam.sessionID && !sessionParam.sessionValidationModule) {
        throw new Error(
          "sessionID or sessionValidationModule should be provided.",
        );
      }

      const sessionSignerData =
        await this.sessionKeyManagerModule.sessionStorageClient.getSessionData(
          sessionParam.sessionID
            ? {
                sessionID: sessionParam.sessionID,
              }
            : {
                sessionValidationModule: sessionParam.sessionValidationModule,
                sessionPublicKey: await sessionSigner.getAddress(),
              },
        );

      const leafDataHex = concat([
        pad(toHex(sessionSignerData.validUntil), { size: 6 }),
        pad(toHex(sessionSignerData.validAfter), { size: 6 }),
        pad(sessionSignerData.sessionValidationModule, { size: 20 }),
        sessionSignerData.sessionKeyData,
      ]);

      const proof = this.sessionKeyManagerModule.merkleTree.getHexProof(
        keccak256(leafDataHex),
      );

      const sessionDataTuple: SessionDataTuple = [
        BigInt(sessionSignerData.validUntil),
        BigInt(sessionSignerData.validAfter),
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        proof,
        sessionParam.additionalSessionData ?? "0x",
      ];

      sessionDataTupleArray.push(sessionDataTuple);
    }

    // Generate the padded signature

    const abiParameters = [
      { type: "address" },
      {
        type: "tuple[]",
        components: [
          { type: "uint48" },
          { type: "uint48" },
          { type: "address" },
          { type: "bytes" },
          { type: "bytes32[]" },
          { type: "bytes" },
        ],
      },
      { type: "bytes" },
    ];

    const paddedSignature = encodeAbiParameters(abiParameters, [
      this.getSessionKeyManagerAddress(),
      sessionDataTupleArray,
      this.mockEcdsaSessionKeySig,
    ]);

    const dummySig = encodeAbiParameters(parseAbiParameters("bytes, address"), [
      paddedSignature as Hex,
      this.getAddress(),
    ]);
    return dummySig;
  }

  /**
   * @remarks Other modules may need additional attributes to build init data
   */
  async getInitData(): Promise<Hex> {
    throw new Error("Method not implemented.");
  }

  /**
   * @remarks This Module dont have knowledge of signer. So, this method is not implemented
   */
  async signMessage(_message: Uint8Array | string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
