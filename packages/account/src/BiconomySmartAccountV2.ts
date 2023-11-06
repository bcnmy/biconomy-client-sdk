import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers, BigNumberish, BytesLike, BigNumber } from "ethers";
import { BaseSmartAccount } from "./BaseSmartAccount";
import { Bytes, getCreate2Address, hexConcat, keccak256, solidityKeccak256 } from "ethers/lib/utils";
import {
  Logger,
  NODE_CLIENT_URL,
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory,
} from "@biconomy/common";
import {
  BiconomyTokenPaymasterRequest,
  BiconomySmartAccountV2Config,
  CounterFactualAddressParam,
  BuildUserOpOptions,
  Overrides,
  NonceOptions,
} from "./utils/Types";
import { BaseValidationModule, ModuleInfo, SendUserOpParams } from "@biconomy/modules";
import { UserOperation, Transaction } from "@biconomy/core-types";
import NodeClient from "@biconomy/node-client";
import INodeClient from "@biconomy/node-client";
import { IHybridPaymaster, BiconomyPaymaster, SponsorUserOperationDto } from "@biconomy/paymaster";
import {
  SupportedChainsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  SmartAccountByOwnerDto,
  SmartAccountsResponse,
  SCWTransactionResponse,
} from "@biconomy/node-client";
import { UserOpResponse } from "@biconomy/bundler";
import {
  BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  DEFAULT_FALLBACK_HANDLER_ADDRESS,
  PROXY_CREATION_CODE,
} from "./utils/Constants";
import log from "loglevel";

type UserOperationKey = keyof UserOperation;
export class BiconomySmartAccountV2 extends BaseSmartAccount {
  private nodeClient!: INodeClient;

  private SENTINEL_MODULE = "0x0000000000000000000000000000000000000001";

  factoryAddress?: string;

  /**
   * our account contract.
   * should support the "execFromEntryPoint" and "nonce" methods
   */
  accountContract?: SmartAccount_v200;

  factory?: SmartAccountFactory_v200;

  private defaultFallbackHandlerAddress!: string;

  private implementationAddress!: string;

  // Validation module responsible for account deployment initCode. This acts as a default authorization module.
  defaultValidationModule!: BaseValidationModule;

  // Deployed Smart Account can have more than one module enabled. When sending a transaction activeValidationModule is used to prepare and validate userOp signature.
  activeValidationModule!: BaseValidationModule;

  private constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountV2Config) {
    super(biconomySmartAccountConfig);
  }

  public static async create(biconomySmartAccountConfig: BiconomySmartAccountV2Config): Promise<BiconomySmartAccountV2> {
    const instance = new BiconomySmartAccountV2(biconomySmartAccountConfig);
    instance.factoryAddress = biconomySmartAccountConfig.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS; // This would be fetched from V2

    const defaultFallbackHandlerAddress =
      instance.factoryAddress === DEFAULT_BICONOMY_FACTORY_ADDRESS
        ? DEFAULT_FALLBACK_HANDLER_ADDRESS
        : biconomySmartAccountConfig.defaultFallbackHandler;
    if (!defaultFallbackHandlerAddress) {
      throw new Error("Default Fallback Handler address is not provided");
    }
    instance.accountAddress = biconomySmartAccountConfig.senderAddress ?? undefined;
    instance.defaultFallbackHandlerAddress = defaultFallbackHandlerAddress;

    instance.implementationAddress = biconomySmartAccountConfig.implementationAddress ?? BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION.V2_0_0;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    instance.defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    instance.activeValidationModule = biconomySmartAccountConfig.activeValidationModule ?? instance.defaultValidationModule;

    const { rpcUrl, nodeClientUrl } = biconomySmartAccountConfig;

    if (rpcUrl) {
      instance.provider = new JsonRpcProvider(rpcUrl);
    }

    instance.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL });

    await instance.init();

    return instance;
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
      this.accountAddress = undefined;
    }
    return this;
  }

  // Could call it nonce space
  async getNonce(nonceKey?: number): Promise<BigNumber> {
    const nonceSpace = nonceKey ?? 0;
    try {
      const accountContract = await this._getAccountContract();
      const nonce = await accountContract.nonce(nonceSpace);
      return nonce;
    } catch (e) {
      log.debug("Failed to get nonce from deployed account. Returning 0 as nonce");
      return BigNumber.from(0);
    }
  }

  /**
   * return the account's address.
   * this value is valid even before deploying the contract.
   */
  async getAccountAddress(params?: CounterFactualAddressParam): Promise<string> {
    if (this.accountAddress == null || this.accountAddress == undefined) {
      this.accountAddress = await this.getCounterFactualAddress(params);
    }
    return this.accountAddress;
  }

  /**
   * calculate the account address even before it is deployed
   */
  async getCounterFactualAddress(params?: CounterFactualAddressParam): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
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
      ]);
      const proxyCreationCodeHash = solidityKeccak256(["bytes", "uint256"], [PROXY_CREATION_CODE, this.implementationAddress]);
      const salt = solidityKeccak256(["bytes32", "uint256"], [keccak256(initCalldata), index]);
      const counterFactualAddress = getCreate2Address(this.factory.address, salt, proxyCreationCodeHash);

      return counterFactualAddress;
    } catch (e) {
      throw new Error(`Failed to get counterfactual address, ${e}`);
    }
  }

  /**
   * return the value to put into the "initCode" field, if the account is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
        this.factory = SmartAccountFactory_v200__factory.connect(this.factoryAddress, this.provider);
      } else {
        throw new Error("no factory to get initCode");
      }
    }

    this.isDefaultValidationModuleDefined();

    return hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
        this.defaultValidationModule.getAddress(),
        await this.defaultValidationModule.getInitData(),
        this.index,
      ]),
    ]);
  }

  /**
   *
   * @param to { target } address of transaction
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns
   */
  async encodeExecute(to: string, value: BigNumberish, data: BytesLike): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("execute_ncC", [to, value, data]);
  }

  /**
   *
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns
   */
  async encodeExecuteBatch(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("executeBatch_y6U", [to, value, data]);
  }

  // dummy signature depends on the validation module supplied.
  async getDummySignature(params?: ModuleInfo): Promise<string> {
    this.isActiveValidationModuleDefined();
    return this.activeValidationModule.getDummySignature(params);
  }

  // Might use provided paymaster instance to get dummy data (from pm service)
  getDummyPaymasterData(): string {
    return "0x";
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
    super.validateUserOp(userOp, requiredFields);
    const userOpHash = await this.getUserOpHash(userOp);

    const moduleSig = await this.activeValidationModule.signUserOpHash(userOpHash, params);

    // Note: If the account is undeployed, use ERC-6492
    // Review: Should only be needed for signMessage
    /*if (!(await this.isAccountDeployed(await this.getAccountAddress()))) {
      const coder = new ethers.utils.AbiCoder();
      const populatedTransaction = await this.factory?.populateTransaction.deployCounterFactualAccount(
        await this.defaultValidationModule.getAddress(),
        await this.defaultValidationModule.getInitData(),
        this.index,
      );
      moduleSig =
        coder.encode(["address", "bytes", "bytes"], [this.factoryAddress, populatedTransaction?.data, moduleSig]) +
        "6492649264926492649264926492649264926492649264926492649264926492"; // magic suffix
      userOp.signature = moduleSig;
      return userOp as UserOperation;
    }*/

    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "address"],
      [moduleSig, this.activeValidationModule.getAddress()],
    );

    userOp.signature = signatureWithModuleAddress;
    return userOp as UserOperation;
  }

  getSignatureWithModuleAddress(moduleSignature: string, moduleAddress?: string): string {
    const moduleAddressToUse = moduleAddress ?? this.activeValidationModule.getAddress();
    return ethers.utils.defaultAbiCoder.encode(["bytes", "address"], [moduleSignature, moduleAddressToUse]);
  }

  /**
   *
   * @param userOp
   * @param params
   * @description This function call will take 'unsignedUserOp' as an input, sign it with the owner key, and send it to the bundler.
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: Partial<UserOperation>, params?: SendUserOpParams): Promise<UserOpResponse> {
    Logger.log("userOp received in base account ", userOp);
    delete userOp.signature;
    const userOperation = await this.signUserOp(userOp, params);
    const bundlerResponse = await this.sendSignedUserOp(userOperation, params);
    return bundlerResponse;
  }

  private async getBuildUserOpNonce(nonceOptions: NonceOptions | undefined): Promise<BigNumber> {
    let nonce = BigNumber.from(0);
    try {
      if (nonceOptions?.nonceOverride) {
        nonce = BigNumber.from(nonceOptions?.nonceOverride);
      } else {
        const _nonceSpace = nonceOptions?.nonceKey ?? 0;
        nonce = await this.getNonce(_nonceSpace);
      }
    } catch (error) {
      // Not throwing this error as nonce would be 0 if this.getNonce() throw exception, which is expected flow for undeployed account
      Logger.log("Error while getting nonce for the account. This is expected for undeployed accounts set nonce to 0");
    }
    return nonce;
  }

  private async getGasFeeValues(
    overrides: Overrides | undefined,
    skipBundlerGasEstimation: boolean | undefined,
  ): Promise<{ maxFeePerGas?: BigNumberish | undefined; maxPriorityFeePerGas?: BigNumberish | undefined }> {
    const gasFeeValues = {
      maxFeePerGas: overrides?.maxFeePerGas,
      maxPriorityFeePerGas: overrides?.maxPriorityFeePerGas,
    };
    try {
      if (this.bundler && !gasFeeValues.maxFeePerGas && !gasFeeValues.maxPriorityFeePerGas && (skipBundlerGasEstimation ?? true)) {
        const gasFeeEstimation = await this.bundler.getGasFeeValues();
        gasFeeValues.maxFeePerGas = gasFeeEstimation.maxFeePerGas;
        gasFeeValues.maxPriorityFeePerGas = gasFeeEstimation.maxPriorityFeePerGas;
      }
      return gasFeeValues;
    } catch (error: any) {
      Logger.error("Error while getting gasFeeValues from bundler. Provided bundler might not have getGasFeeValues endpoint", error);
      return gasFeeValues;
    }
  }

  async buildUserOp(transactions: Transaction[], buildUseropDto?: BuildUserOpOptions): Promise<Partial<UserOperation>> {
    const to = transactions.map((element: Transaction) => element.to);
    const data = transactions.map((element: Transaction) => element.data ?? "0x");
    const value = transactions.map((element: Transaction) => element.value ?? BigNumber.from("0"));

    const initCodeFetchPromise = this.getInitCode();
    const dummySignatureFetchPromise = this.getDummySignature(buildUseropDto?.params);

    const [nonceFromFetch, initCode, signature, finalGasFeeValue] = await Promise.all([
      this.getBuildUserOpNonce(buildUseropDto?.nonceOptions),
      initCodeFetchPromise,
      dummySignatureFetchPromise,
      this.getGasFeeValues(buildUseropDto?.overrides, buildUseropDto?.skipBundlerGasEstimation),
    ]);

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

    let userOp: Partial<UserOperation> = {
      sender: await this.getAccountAddress(),
      nonce: nonceFromFetch,
      initCode,
      callData: callData,
      maxFeePerGas: finalGasFeeValue.maxFeePerGas || undefined,
      maxPriorityFeePerGas: finalGasFeeValue.maxPriorityFeePerGas || undefined,
    };

    // for this Smart Account current validation module dummy signature will be used to estimate gas
    userOp.signature = signature;

    // Note: Can change the default behaviour of calling estimations using bundler/local
    userOp = await this.estimateUserOpGas(
      userOp,
      buildUseropDto?.overrides,
      buildUseropDto?.skipBundlerGasEstimation,
      buildUseropDto?.paymasterServiceData,
    );
    Logger.log("UserOp after estimation ", userOp);

    return userOp;
  }

  private validateUserOpAndPaymasterRequest(userOp: Partial<UserOperation>, tokenPaymasterRequest: BiconomyTokenPaymasterRequest): void {
    if (!userOp.callData) {
      throw new Error("UserOp callData cannot be undefined");
    }

    const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress;
    Logger.log("Requested fee token is ", feeTokenAddress);

    if (!feeTokenAddress || feeTokenAddress == ethers.constants.AddressZero) {
      throw new Error("Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest");
    }

    const spender = tokenPaymasterRequest?.spender;
    Logger.log("Spender address is ", spender);

    if (!spender || spender == ethers.constants.AddressZero) {
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

        if (approvalRequest.data == "0x" || approvalRequest.to == ethers.constants.AddressZero) {
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
        const finalUserOp: Partial<UserOperation> = {
          ...userOp,
          callData: newCallData,
        };

        return finalUserOp;
      }
    } catch (error) {
      Logger.log("Failed to update userOp. Sending back original op");
      Logger.error("Failed to update callData with error", error);
      return userOp;
    }
    return userOp;
  }

  async signUserOpHash(userOpHash: string, params?: SendUserOpParams): Promise<string> {
    this.isActiveValidationModuleDefined();
    const moduleSig = await this.activeValidationModule.signUserOpHash(userOpHash, params);

    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "address"],
      [moduleSig, this.activeValidationModule.getAddress()],
    );

    return signatureWithModuleAddress;
  }

  async signMessage(message: Bytes | string): Promise<string> {
    this.isActiveValidationModuleDefined();
    const dataHash = ethers.utils.arrayify(ethers.utils.hashMessage(message));
    let signature = await this.activeValidationModule.signMessage(dataHash);

    if (signature.slice(0, 2) !== "0x") {
      signature = "0x" + signature;
    }

    // If the account is undeployed, use ERC-6492
    if (!(await this.isAccountDeployed(await this.getAccountAddress()))) {
      const coder = new ethers.utils.AbiCoder();
      const populatedTransaction = await this.factory?.populateTransaction.deployCounterFactualAccount(
        await this.defaultValidationModule.getAddress(),
        await this.defaultValidationModule.getInitData(),
        this.index,
      );
      signature =
        coder.encode(["address", "bytes", "bytes"], [this.factoryAddress, populatedTransaction?.data, signature]) +
        "6492649264926492649264926492649264926492649264926492649264926492"; // magic suffix
    }
    return signature;
  }

  async getAllTokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse> {
    return this.nodeClient.getAllTokenBalances(balancesDto);
  }

  async getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse> {
    return this.nodeClient.getTotalBalanceInUsd(balancesDto);
  }

  async getSmartAccountsByOwner(smartAccountByOwnerDto: SmartAccountByOwnerDto): Promise<SmartAccountsResponse> {
    return this.nodeClient.getSmartAccountsByOwner(smartAccountByOwnerDto);
  }

  async getTransactionsByAddress(chainId: number, address: string): Promise<SCWTransactionResponse[]> {
    return this.nodeClient.getTransactionByAddress(chainId, address);
  }

  async getTransactionByHash(txHash: string): Promise<SCWTransactionResponse> {
    return this.nodeClient.getTransactionByHash(txHash);
  }

  async getAllSupportedChains(): Promise<SupportedChainsResponse> {
    return this.nodeClient.getAllSupportedChains();
  }

  getImplementationAddress(): string {
    return this.implementationAddress;
  }

  async enableModule(moduleAddress: string): Promise<UserOpResponse> {
    const tx: Transaction = await this.getEnableModuleData(moduleAddress);
    const partialUserOp = await this.buildUserOp([tx]);
    return this.sendUserOp(partialUserOp);
  }

  async getEnableModuleData(moduleAddress: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract();
    const data = accountContract.interface.encodeFunctionData("enableModule", [moduleAddress]);
    const tx: Transaction = {
      to: await this.getAccountAddress(),
      value: "0",
      data: data as string,
    };
    return tx;
  }

  async getSetupAndEnableModuleData(moduleAddress: string, moduleSetupData: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract();
    const data = accountContract.interface.encodeFunctionData("setupAndEnableModule", [moduleAddress, moduleSetupData]);
    const tx: Transaction = {
      to: await this.getAccountAddress(),
      value: "0",
      data: data,
    };
    return tx;
  }

  async disableModule(prevModule: string, moduleAddress: string): Promise<UserOpResponse> {
    const tx: Transaction = await this.getDisableModuleData(prevModule, moduleAddress);
    const partialUserOp = await this.buildUserOp([tx]);
    return this.sendUserOp(partialUserOp);
  }

  async getDisableModuleData(prevModule: string, moduleAddress: string): Promise<Transaction> {
    const accountContract = await this._getAccountContract();
    const data = accountContract.interface.encodeFunctionData("disableModule", [prevModule, moduleAddress]);
    const tx: Transaction = {
      to: await this.getAccountAddress(),
      value: "0",
      data: data,
    };
    return tx;
  }

  async isModuleEnabled(moduleName: string): Promise<boolean> {
    const accountContract = await this._getAccountContract();
    return accountContract.isModuleEnabled(moduleName);
  }

  async getAllModules(pageSize?: number): Promise<Array<string>> {
    pageSize = pageSize ?? 100;
    const accountContract = await this._getAccountContract();
    // Note: If page size is lower then on the next page start module would be module at the end of first page and not SENTINEL_MODULE
    const result: Array<string | Array<string>> = await accountContract.getModulesPaginated(this.SENTINEL_MODULE, pageSize);
    const modules: Array<string> = result[0] as Array<string>;
    return modules;
  }
}
