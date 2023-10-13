import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { ethers, BigNumberish, BytesLike, BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { BaseSmartContractAccount, getChain } from "@alchemy/aa-core";
import { Bytes, hexConcat } from "ethers/lib/utils";
import { Hex, isHex, keccak256, encodePacked, toHex, getCreate2Address, concat, encodeAbiParameters, parseAbiParameters } from "viem";
import {
  Logger,
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory,
  RPC_PROVIDER_URLS,
  packUserOp,
  NODE_CLIENT_URL,
} from "@biconomy/common";
import {
  BiconomyTokenPaymasterRequest,
  BiconomySmartAccountV2Config,
  CounterFactualAddressParam,
  BuildUserOpOptions,
  Overrides,
} from "./utils/Types";
import {
  BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  DEFAULT_FALLBACK_HANDLER_ADDRESS,
  PROXY_CREATION_CODE,
} from "./utils/Constants";
import { BaseValidationModule, ModuleInfo, SendUserOpParams } from "@biconomy/modules";
import { UserOperation, Transaction } from "@biconomy/core-types";
import { IHybridPaymaster, BiconomyPaymaster, SponsorUserOperationDto } from "@biconomy/paymaster";
import { IBundler, UserOpResponse } from "@biconomy/bundler";
import NodeClient from "@biconomy/node-client";
import INodeClient from "@biconomy/node-client";

type UserOperationKey = keyof UserOperation;

export class BiconomySmartAccountV2 extends BaseSmartContractAccount {
  private SENTINEL_MODULE = "0x0000000000000000000000000000000000000001";

  private index: number;

  private nodeClient: INodeClient;

  private provider: Provider;

  private paymaster?: BiconomyPaymaster;

  private bundler?: IBundler;

  private accountContract?: SmartAccount_v200;

  private factory?: SmartAccountFactory_v200;

  private defaultFallbackHandlerAddress: Hex;

  private implementationAddress: Hex;

  // Validation module responsible for account deployment initCode. This acts as a default authorization module.
  defaultValidationModule: BaseValidationModule;

  // Deployed Smart Account can have more than one module enabled. When sending a transaction activeValidationModule is used to prepare and validate userOp signature.
  activeValidationModule: BaseValidationModule;

  private constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountV2Config) {
    super({
      ...biconomySmartAccountConfig,
      chain: getChain(biconomySmartAccountConfig.chainId),
      rpcClient: biconomySmartAccountConfig.rpcUrl || (RPC_PROVIDER_URLS[biconomySmartAccountConfig.chainId] as string),
      entryPointAddress: biconomySmartAccountConfig.entryPointAddress as Hex,
      accountAddress: biconomySmartAccountConfig.accountAddress as Hex,
      factoryAddress: biconomySmartAccountConfig.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS,
    });
    this.index = biconomySmartAccountConfig.index ?? 0;
    this.defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule;
    this.activeValidationModule = biconomySmartAccountConfig.activeValidationModule ?? this.defaultValidationModule;
    this.implementationAddress = biconomySmartAccountConfig.implementationAddress ?? (BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION.V2_0_0 as Hex);
    const defaultFallbackHandlerAddress =
      this.factoryAddress === DEFAULT_BICONOMY_FACTORY_ADDRESS ? DEFAULT_FALLBACK_HANDLER_ADDRESS : biconomySmartAccountConfig.defaultFallbackHandler;
    if (!defaultFallbackHandlerAddress) {
      throw new Error("Default Fallback Handler address is not provided");
    }
    this.defaultFallbackHandlerAddress = defaultFallbackHandlerAddress;

    // TODO: use rpcProvider generated in base class?
    const { rpcUrl, nodeClientUrl } = biconomySmartAccountConfig;
    if (rpcUrl) {
      this.provider = new JsonRpcProvider(rpcUrl);
    } else {
      this.provider = new JsonRpcProvider(RPC_PROVIDER_URLS[biconomySmartAccountConfig.chainId]);
    }

    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL });
  }

  public static async create(biconomySmartAccountConfig: BiconomySmartAccountV2Config): Promise<BiconomySmartAccountV2> {
    const instance = new BiconomySmartAccountV2(biconomySmartAccountConfig);
    // Can do async init stuff here
    return instance;
  }

  // Calls the getCounterFactualAddress
  async getAddress(params?: CounterFactualAddressParam): Promise<Hex> {
    if (this.accountAddress == null) {
      // means it needs deployment
      this.accountAddress = await this.getCounterFactualAddress(params);
    }
    return this.accountAddress;
  }

  // Calls the getCounterFactualAddress
  async getAccountAddress(params?: CounterFactualAddressParam): Promise<string> {
    if (this.accountAddress == null) {
      // means it needs deployment
      this.accountAddress = await this.getCounterFactualAddress(params);
    }
    return this.accountAddress;
  }

  /**
   * Return the account's address. This value is valid even before deploying the contract.
   */
  async getCounterFactualAddress(params?: CounterFactualAddressParam): Promise<Hex> {
    if (this.factory == null) {
      if (isHex(this.factoryAddress)) {
        this.factory = SmartAccountFactory_v200__factory.connect(this.factoryAddress, this.provider);
      } else {
        throw new Error("no factory to get initCode");
      }
    }

    const validationModule = params?.validationModule ?? this.defaultValidationModule;
    const index = params?.index ?? this.index;

    try {
      const initCalldata = SmartAccount_v200__factory.createInterface().encodeFunctionData("init", [
        this.defaultFallbackHandlerAddress,
        validationModule.getAddress(),
        await validationModule.getInitData(),
      ]) as Hex;

      const proxyCreationCodeHash = keccak256(encodePacked(["bytes", "uint256"], [PROXY_CREATION_CODE, BigInt(this.implementationAddress)]));

      const salt = keccak256(encodePacked(["bytes32", "uint256"], [keccak256(initCalldata), BigInt(index)]));

      const counterFactualAddress = getCreate2Address({
        from: this.factory.address as Hex,
        salt: salt,
        bytecodeHash: proxyCreationCodeHash,
      });

      return counterFactualAddress;
    } catch (e) {
      throw new Error(`Failed to get counterfactual address, ${e}`);
    }
  }

  async _getAccountContract(): Promise<SmartAccount_v200> {
    if (this.accountContract == null) {
      this.accountContract = SmartAccount_v200__factory.connect(await this.getAccountAddress(), this.provider);
    }
    return this.accountContract;
  }

  isActiveValidationModuleDefined(): boolean {
    if (!this.activeValidationModule) throw new Error("Must provide an instance of active validation module.");
    return true;
  }

  isDefaultValidationModuleDefined(): boolean {
    if (!this.defaultValidationModule) throw new Error("Must provide an instance of default validation module.");
    return true;
  }

  setActiveValidationModule(validationModule: BaseValidationModule): BiconomySmartAccountV2 {
    if (validationModule instanceof BaseValidationModule) {
      this.activeValidationModule = validationModule;
    }
    return this;
  }

  setDefaultValidationModule(validationModule: BaseValidationModule): BiconomySmartAccountV2 {
    if (validationModule instanceof BaseValidationModule) {
      this.defaultValidationModule = validationModule;
    }
    return this;
  }

  /**
   * Return the value to put into the "initCode" field, if the account is not yet deployed.
   * This value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<Hex> {
    if (this.factory == null) {
      if (isHex(this.factoryAddress)) {
        this.factory = SmartAccountFactory_v200__factory.connect(this.factoryAddress, this.provider);
      } else {
        throw new Error("no factory to get initCode");
      }
    }

    this.isDefaultValidationModuleDefined();

    return concat([
      this.factory.address as Hex,
      this.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
        this.defaultValidationModule.getAddress(),
        await this.defaultValidationModule.getInitData(),
        this.index,
      ]) as Hex,
    ]);
  }

  /**
   *
   * @param to { target } address of transaction
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns encoded data for execute function
   */
  async encodeExecute(to: string, value: BigNumberish, data: BytesLike): Promise<Hex> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("execute_ncC", [to, value, data]) as Hex;
  }

  /**
   *
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns encoded data for executeBatch function
   */
  async encodeExecuteBatch(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>): Promise<Hex> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("executeBatch_y6U", [to, value, data]) as Hex;
  }

  // dummy signature depends on the validation module supplied.
  async getDummySignatures(params?: ModuleInfo): Promise<Hex> {
    this.isActiveValidationModuleDefined();
    return (await this.activeValidationModule.getDummySignature(params)) as Hex;
  }

  // TODO: review this
  getDummySignature(): Hex {
    throw new Error("Method not implemented! Call getDummySignatures instead.");
  }

  // Might use provided paymaster instance to get dummy data (from pm service)
  getDummyPaymasterData(): string {
    return "0x";
  }

  validateUserOp(userOp: Partial<UserOperation>, requiredFields: UserOperationKey[]): boolean {
    for (const field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${String(field)} is missing in the UserOp`);
      }
    }
    return true;
  }

  async signUserOp(userOp: Partial<UserOperation>, params?: SendUserOpParams): Promise<UserOperation> {
    this.isActiveValidationModuleDefined();
    const requiredFields: UserOperationKey[] = [
      "sender",
      "nonce",
      "initCode",
      "callData",
      "callGasLimit",
      "verificationGasLimit",
      "preVerificationGas",
      "maxFeePerGas",
      "maxPriorityFeePerGas",
      "paymasterAndData",
    ];
    this.validateUserOp(userOp, requiredFields);
    const userOpHash = await this.getUserOpHash(userOp);

    const moduleSig = (await this.activeValidationModule.signUserOpHash(userOpHash, params)) as Hex;

    // Note: If the account is undeployed, use ERC-6492
    // Review: Should only be needed for signMessage
    // if (!(await this.isAccountDeployed(await this.getAccountAddress()))) {
    //   const coder = new ethers.utils.AbiCoder();
    //   const populatedTransaction = await this.factory?.populateTransaction.deployCounterFactualAccount(
    //     await this.defaultValidationModule.getAddress(),
    //     await this.defaultValidationModule.getInitData(),
    //     this.index,
    //   );
    //   moduleSig =
    //     coder.encode(["address", "bytes", "bytes"], [this.factoryAddress, populatedTransaction?.data, moduleSig]) +
    //     "6492649264926492649264926492649264926492649264926492649264926492"; // magic suffix
    //   userOp.signature = moduleSig;
    //   return userOp as UserOperation;
    // }

    const signatureWithModuleAddress = encodeAbiParameters(parseAbiParameters("bytes, address"), [
      moduleSig,
      this.activeValidationModule.getAddress() as Hex,
    ]);

    userOp.signature = signatureWithModuleAddress;
    return userOp as UserOperation;
  }

  getSignatureWithModuleAddress(moduleSignature: Hex, moduleAddress?: Hex): Hex {
    const moduleAddressToUse = moduleAddress ?? (this.activeValidationModule.getAddress() as Hex);
    return encodeAbiParameters(parseAbiParameters("bytes, address"), [moduleSignature, moduleAddressToUse]);
  }

  /**
   *
   * @param userOp
   * @param params
   * @description This function call will take 'unsignedUserOp' as an input, sign it with the owner key, and send it to the bundler.
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: Partial<UserOperation>, params?: ModuleInfo): Promise<UserOpResponse> {
    Logger.log("userOp received in base account ", userOp);
    delete userOp.signature;
    const userOperation = await this.signUserOp(userOp, params);
    const bundlerResponse = await this.sendSignedUserOp(userOperation);
    return bundlerResponse;
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'signedUserOp' as input and send it to the bundler
   * @returns
   */
  async sendSignedUserOp(userOp: UserOperation): Promise<UserOpResponse> {
    const requiredFields: UserOperationKey[] = [
      "sender",
      "nonce",
      "initCode",
      "callData",
      "callGasLimit",
      "verificationGasLimit",
      "preVerificationGas",
      "maxFeePerGas",
      "maxPriorityFeePerGas",
      "paymasterAndData",
      "signature",
    ];
    this.validateUserOp(userOp, requiredFields);
    Logger.log("userOp validated");
    if (!this.bundler) throw new Error("Bundler is not provided");
    Logger.log("userOp being sent to the bundler", userOp);
    const bundlerResponse = await this.bundler.sendUserOp(userOp);
    return bundlerResponse;
  }

  async getUserOpHash(userOp: Partial<UserOperation>): Promise<Hex> {
    const userOpHash = keccak256(packUserOp(userOp, true));
    const enc = defaultAbiCoder.encode(["bytes32", "address", "uint256"], [userOpHash, this.entryPoint.address, this.chainId]);
    return keccak256(enc);
  }

  async estimateCreationGas(initCode?: string): Promise<BigNumberish> {
    if (initCode == null || initCode === "0x") return 0;
    const deployerAddress = initCode.substring(0, 42);
    const deployerCallData = "0x" + initCode.substring(42);
    return this.provider.estimateGas({
      to: deployerAddress,
      data: deployerCallData,
    });
  }

  async calculateUserOpGasValues(userOp: Partial<UserOperation>): Promise<Partial<UserOperation>> {
    if (!this.provider) throw new Error("Provider is not present for making rpc calls");
    const feeData = await this.provider.getFeeData();
    userOp.maxFeePerGas = userOp.maxFeePerGas ?? feeData.maxFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice());
    userOp.maxPriorityFeePerGas =
      userOp.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice());
    if (userOp.initCode) userOp.verificationGasLimit = userOp.verificationGasLimit ?? (await this.getVerificationGasLimit(userOp.initCode));
    userOp.callGasLimit =
      userOp.callGasLimit ??
      (await this.provider.estimateGas({
        from: this.entryPointAddress,
        to: userOp.sender,
        data: userOp.callData,
      }));
    userOp.preVerificationGas = userOp.preVerificationGas ?? (await this.getPreVerificationGas(userOp));
    return userOp;
  }

  async estimateUserOpGas(
    userOp: Partial<UserOperation>,
    overrides?: Overrides,
    skipBundlerGasEstimation?: boolean,
  ): Promise<Partial<UserOperation>> {
    const requiredFields: UserOperationKey[] = ["sender", "nonce", "initCode", "callData"];
    this.validateUserOp(userOp, requiredFields);

    let finalUserOp = userOp;
    const skipBundlerCall = skipBundlerGasEstimation ?? false;
    // Override gas values in userOp if provided in overrides params
    if (overrides) {
      userOp = { ...userOp, ...overrides };
    }

    Logger.log("userOp in estimation", userOp);

    if (!this.bundler || skipBundlerCall) {
      if (!this.provider) throw new Error("Provider is not present for making rpc calls");
      // if no bundler url is provided run offchain logic to assign following values of UserOp
      // maxFeePerGas, maxPriorityFeePerGas, verificationGasLimit, callGasLimit, preVerificationGas
      finalUserOp = await this.calculateUserOpGasValues(userOp);
    } else {
      delete userOp.maxFeePerGas;
      delete userOp.maxPriorityFeePerGas;
      // Making call to bundler to get gas estimations for userOp
      const { callGasLimit, verificationGasLimit, preVerificationGas, maxFeePerGas, maxPriorityFeePerGas } =
        await this.bundler.estimateUserOpGas(userOp);
      // if neither user sent gas fee nor the bundler, estimate gas from provider
      if (!userOp.maxFeePerGas && !userOp.maxPriorityFeePerGas && (!maxFeePerGas || !maxPriorityFeePerGas)) {
        const feeData = await this.provider.getFeeData();
        finalUserOp.maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice());
        finalUserOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice());
      } else {
        finalUserOp.maxFeePerGas = maxFeePerGas ?? userOp.maxFeePerGas;
        finalUserOp.maxPriorityFeePerGas = maxPriorityFeePerGas ?? userOp.maxPriorityFeePerGas;
      }
      finalUserOp.verificationGasLimit = verificationGasLimit ?? userOp.verificationGasLimit;
      finalUserOp.callGasLimit = callGasLimit ?? userOp.callGasLimit;
      finalUserOp.preVerificationGas = preVerificationGas ?? userOp.preVerificationGas;
    }
    return finalUserOp;
  }

  async buildUserOp(transactions: Transaction[], buildUseropDto?: BuildUserOpOptions): Promise<Partial<UserOperation>> {
    // Review: may not need at all
    // this.isInitialized()

    // TODO: validate to, value and data fields
    // TODO: validate overrides if supplied
    const to = transactions.map((element: Transaction) => element.to);
    const data = transactions.map((element: Transaction) => element.data ?? "0x");
    const value = transactions.map((element: Transaction) => element.value ?? BigNumber.from("0"));

    if (transactions.length === 0) {
      throw new Error("Transactions array cannot be empty");
    }

    let callData = "";
    if (transactions.length > 1 || buildUseropDto?.forceEncodeForBatch) {
      callData = await this.encodeExecuteBatch(to, value, data);
    } else {
      // transactions.length must be 1
      callData = await this.encodeExecute(to[0], value[0], data[0]);
    }

    let nonce = BigNumber.from(0);
    try {
      if (buildUseropDto?.nonceOptions?.nonceOverride) {
        nonce = BigNumber.from(buildUseropDto?.nonceOptions?.nonceOverride);
      } else {
        const _nonceSpace = buildUseropDto?.nonceOptions?.nonceKey ?? 0;
        // TODO: check if this is correct
        nonce = BigNumber.from(await this.getNonce()).add(_nonceSpace);
      }
    } catch (error) {
      // Not throwing this error as nonce would be 0 if this.getNonce() throw exception, which is expected flow for undeployed account
    }

    let userOp: Partial<UserOperation> = {
      sender: this.accountAddress,
      nonce,
      initCode: await this.getInitCode(),
      callData: callData,
    };

    // for this Smart Account current validation module dummy signature will be used to estimate gas
    userOp.signature = await this.getDummySignatures(buildUseropDto?.params);

    userOp = await this.estimateUserOpGas(userOp, buildUseropDto?.overrides, buildUseropDto?.skipBundlerGasEstimation);
    Logger.log("UserOp after estimation ", userOp);

    // Do not populate paymasterAndData as part of buildUserOp as it may not have all necessary details
    userOp.paymasterAndData = "0x"; // await this.getPaymasterAndData(userOp)

    return userOp;
  }

  private validateUserOpAndPaymasterRequest(userOp: Partial<UserOperation>, tokenPaymasterRequest: BiconomyTokenPaymasterRequest): void {
    if (!userOp.callData) {
      throw new Error("UserOp callData cannot be undefined");
    }

    const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress;
    Logger.log("Requested fee token is ", feeTokenAddress);

    if (!feeTokenAddress || feeTokenAddress === ethers.constants.AddressZero) {
      throw new Error("Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest");
    }

    const spender = tokenPaymasterRequest?.spender;
    Logger.log("Spender address is ", spender);

    if (!spender || spender === ethers.constants.AddressZero) {
      throw new Error("Invalid or missing spender address. Sepnder address must be part of tokenPaymasterRequest");
    }
  }

  /**
   *
   * @param userOp partial user operation without signature and paymasterAndData
   * @param tokenPaymasterRequest This dto provides information about fee quote. Fee quote is received from earlier request getFeeQuotesOrData() to the Biconomy paymaster.
   *  maxFee and token decimals from the quote, along with the spender is required to append approval transaction.
   * @notice This method should be called when gas is paid in ERC20 token using TokenPaymaster
   * @description Optional method to update the userOp.calldata with batched transaction which approves the paymaster spender with necessary amount(if required)
   * @returns updated userOp with new callData, callGasLimit
   */
  async buildTokenPaymasterUserOp(
    userOp: Partial<UserOperation>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
  ): Promise<Partial<UserOperation>> {
    this.validateUserOpAndPaymasterRequest(userOp, tokenPaymasterRequest);
    try {
      let batchTo: Array<string> = [];
      let batchValue: Array<string | BigNumberish> = [];
      let batchData: Array<string> = [];

      let newCallData = userOp.callData;
      Logger.log("Received information about fee token address and quote ", tokenPaymasterRequest);

      if (this.paymaster && this.paymaster instanceof BiconomyPaymaster) {
        // Make a call to paymaster.buildTokenApprovalTransaction() with necessary details

        // Review: might request this form of an array of Transaction
        const approvalRequest: Transaction = await (this.paymaster as IHybridPaymaster<SponsorUserOperationDto>).buildTokenApprovalTransaction(
          tokenPaymasterRequest,
          this.provider,
        );
        Logger.log("ApprovalRequest is for erc20 token ", approvalRequest.to);

        if (approvalRequest.data === "0x" || approvalRequest.to === ethers.constants.AddressZero) {
          return userOp;
        }

        if (!userOp.callData) {
          throw new Error("UserOp callData cannot be undefined");
        }

        const account = await this._getAccountContract();

        const decodedSmartAccountData = account.interface.parseTransaction({
          data: userOp.callData.toString(),
        });
        if (!decodedSmartAccountData) {
          throw new Error("Could not parse userOp call data for this smart account");
        }

        const smartAccountExecFunctionName = decodedSmartAccountData.name;

        Logger.log(`Originally an ${smartAccountExecFunctionName} method call for Biconomy Account V2`);
        if (smartAccountExecFunctionName === "execute" || smartAccountExecFunctionName === "execute_ncC") {
          const methodArgsSmartWalletExecuteCall = decodedSmartAccountData.args;
          const toOriginal = methodArgsSmartWalletExecuteCall[0];
          const valueOriginal = methodArgsSmartWalletExecuteCall[1];
          const dataOriginal = methodArgsSmartWalletExecuteCall[2];

          batchTo.push(toOriginal);
          batchValue.push(valueOriginal);
          batchData.push(dataOriginal);
        } else if (smartAccountExecFunctionName === "executeBatch" || smartAccountExecFunctionName === "executeBatch_y6U") {
          const methodArgsSmartWalletExecuteCall = decodedSmartAccountData.args;
          batchTo = methodArgsSmartWalletExecuteCall[0];
          batchValue = methodArgsSmartWalletExecuteCall[1];
          batchData = methodArgsSmartWalletExecuteCall[2];
        }

        if (approvalRequest.to && approvalRequest.data && approvalRequest.value) {
          batchTo = [approvalRequest.to, ...batchTo];
          batchValue = [approvalRequest.value, ...batchValue];
          batchData = [approvalRequest.data, ...batchData];

          newCallData = await this.encodeExecuteBatch(batchTo, batchValue, batchData);
        }
        let finalUserOp: Partial<UserOperation> = {
          ...userOp,
          callData: newCallData,
        };

        // Requesting to update gas limits again (especially callGasLimit needs to be re-calculated)
        try {
          finalUserOp = await this.estimateUserOpGas(finalUserOp);
          const callGasLimit = ethers.BigNumber.from(finalUserOp.callGasLimit);
          if (finalUserOp.callGasLimit && callGasLimit.lt(ethers.BigNumber.from("21000"))) {
            return {
              ...userOp,
              callData: newCallData,
            };
          }
          Logger.log("UserOp after estimation ", finalUserOp);
        } catch (error) {
          Logger.error("Failed to estimate gas for userOp with updated callData ", error);
          Logger.log("Sending updated userOp. calculateGasLimit flag should be sent to the paymaster to be able to update callGasLimit");
        }
        return finalUserOp;
      }
    } catch (error) {
      Logger.log("Failed to update userOp. Sending back original op");
      Logger.error("Failed to update callData with error", error);
      return userOp;
    }
    return userOp;
  }

  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string> {
    this.isActiveValidationModuleDefined();
    const moduleSig = await this.activeValidationModule.signUserOpHash(userOpHash, params);

    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "address"],
      [moduleSig, this.activeValidationModule.getAddress()],
    );

    return signatureWithModuleAddress;
  }

  async signMessage(message: Bytes | string): Promise<Hex> {
    this.isActiveValidationModuleDefined();
    const dataHash = ethers.utils.arrayify(ethers.utils.hashMessage(message));
    let signature = await this.activeValidationModule.signMessage(dataHash);

    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = signature.slice(0, -2) + correctV.toString(16);
    }
    if (signature.slice(0, 2) !== "0x") {
      signature = "0x" + signature;
    }
    return signature as Hex;
  }

  async enableModule(moduleAddress: string): Promise<UserOpResponse> {
    const tx: Transaction = await this.getEnableModuleData(moduleAddress);
    const partialUserOp = await this.buildUserOp([tx]);
    return this.sendUserOp(partialUserOp);
  }

  async getEnableModuleData(moduleAddress: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract();
    const populatedTransaction = await accountContract.populateTransaction.enableModule(moduleAddress);
    const tx: Transaction = {
      to: await this.getAddress(),
      value: "0",
      data: populatedTransaction.data as string,
    };
    return tx;
  }

  async getSetupAndEnableModuleData(moduleAddress: string, moduleSetupData: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract();
    // TODO: using encodeFunctionData
    const populatedTransaction = await accountContract.populateTransaction.setupAndEnableModule(moduleAddress, moduleSetupData);
    const tx: Transaction = {
      to: await this.getAddress(),
      value: "0",
      data: populatedTransaction.data as string,
    };
    return tx;
  }

  async disableModule(preModule: string, moduleAddress: string): Promise<UserOpResponse> {
    const tx: Transaction = await this.getDisableModuleData(preModule, moduleAddress);
    const partialUserOp = await this.buildUserOp([tx]);
    return this.sendUserOp(partialUserOp);
  }

  async getDisableModuleData(prevModule: string, moduleAddress: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract();
    // TODO: using encodeFunctionData
    const populatedTransaction = await accountContract.populateTransaction.disableModule(prevModule, moduleAddress);
    const tx: Transaction = {
      to: await this.getAddress(),
      value: "0",
      data: populatedTransaction.data as string,
    };
    return tx;
  }

  async isModuleEnabled(moduleName: string): Promise<boolean> {
    const accountContract = await this._getAccountContract();
    return accountContract.isModuleEnabled(moduleName);
  }

  // Review
  async getAllModules(pageSize?: number): Promise<Array<string>> {
    pageSize = pageSize ?? 100;
    const accountContract = await this._getAccountContract();
    const result: Array<string | Array<string>> = await accountContract.getModulesPaginated(this.SENTINEL_MODULE, pageSize);
    const modules: Array<string> = result[0] as Array<string>;
    return modules;
  }
}
