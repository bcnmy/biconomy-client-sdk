import {
  Hex,
  keccak256,
  encodePacked,
  getCreate2Address,
  encodeAbiParameters,
  parseAbiParameters,
  toHex,
  hexToNumber,
  toBytes,
  encodeFunctionData,
  PublicClient,
  createPublicClient,
  http,
  concatHex,
  GetContractReturnType,
  Chain,
  getContract,
  decodeFunctionData,
  WalletClient,
} from "viem";
import {
  BaseSmartContractAccount,
  getChain,
  type BigNumberish,
  type UserOperationStruct,
  BatchUserOperationCallData,
  WalletClientSigner,
} from "@alchemy/aa-core";
import { isNullOrUndefined, packUserOp } from "./utils/Utils";
import { BaseValidationModule, ModuleInfo, SendUserOpParams, ECDSAOwnershipValidationModule } from "@biconomy/modules";
import { IHybridPaymaster, IPaymaster, BiconomyPaymaster, SponsorUserOperationDto } from "@biconomy/paymaster";
import { Bundler, IBundler, UserOpResponse } from "@biconomy/bundler";
import {
  BiconomyTokenPaymasterRequest,
  BiconomySmartAccountV2Config,
  CounterFactualAddressParam,
  BuildUserOpOptions,
  Overrides,
  NonceOptions,
  Transaction,
  QueryParamsForAddressResolver,
  BiconomySmartAccountV2ConfigConstructorProps,
} from "./utils/Types";
import {
  ADDRESS_RESOLVER_ADDRESS,
  BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  DEFAULT_FALLBACK_HANDLER_ADDRESS,
  PROXY_CREATION_CODE,
  ADDRESS_ZERO,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "./utils/Constants";
import { BiconomyFactoryAbi } from "./abi/Factory";
import { BiconomyAccountAbi } from "./abi/SmartAccount";
import { AccountResolverAbi } from "./abi/AccountResolver";

type UserOperationKey = keyof UserOperationStruct;

export class BiconomySmartAccountV2 extends BaseSmartContractAccount {
  private SENTINEL_MODULE = "0x0000000000000000000000000000000000000001";

  private index: number;

  private chainId: number;

  private provider: PublicClient;

  paymaster?: IPaymaster;

  bundler?: IBundler;

  private accountContract?: GetContractReturnType<typeof BiconomyAccountAbi, PublicClient, Chain>;

  private defaultFallbackHandlerAddress: Hex;

  private implementationAddress: Hex;

  private scanForUpgradedAccountsFromV1!: boolean;

  private maxIndexForScan!: number;

  // Validation module responsible for account deployment initCode. This acts as a default authorization module.
  defaultValidationModule!: BaseValidationModule;

  // Deployed Smart Account can have more than one module enabled. When sending a transaction activeValidationModule is used to prepare and validate userOp signature.
  activeValidationModule!: BaseValidationModule;

  private constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountV2ConfigConstructorProps) {
    super({
      ...biconomySmartAccountConfig,
      chain: getChain(biconomySmartAccountConfig.chainId),
      rpcClient: biconomySmartAccountConfig.rpcUrl || getChain(biconomySmartAccountConfig.chainId).rpcUrls.public.http[0],
      entryPointAddress: (biconomySmartAccountConfig.entryPointAddress as Hex) ?? DEFAULT_ENTRYPOINT_ADDRESS,
      accountAddress: (biconomySmartAccountConfig.accountAddress as Hex) ?? undefined,
      factoryAddress: biconomySmartAccountConfig.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS,
    });

    this.defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule;
    this.activeValidationModule = biconomySmartAccountConfig.activeValidationModule;

    this.index = biconomySmartAccountConfig.index ?? 0;
    this.chainId = biconomySmartAccountConfig.chainId;
    this.bundler = biconomySmartAccountConfig.bundler;
    this.implementationAddress = biconomySmartAccountConfig.implementationAddress ?? (BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION.V2_0_0 as Hex);

    if (biconomySmartAccountConfig.biconomyPaymasterApiKey) {
      this.paymaster = new BiconomyPaymaster({
        paymasterUrl: `https://paymaster.biconomy.io/api/v1/${biconomySmartAccountConfig.chainId}/${biconomySmartAccountConfig.biconomyPaymasterApiKey}`,
      });
    } else {
      this.paymaster = biconomySmartAccountConfig.paymaster;
    }

    if (biconomySmartAccountConfig.bundlerUrl) {
      this.bundler = new Bundler({
        bundlerUrl: biconomySmartAccountConfig.bundlerUrl,
        chainId: biconomySmartAccountConfig.chainId,
      });
    } else {
      this.bundler = biconomySmartAccountConfig.bundler;
    }

    const defaultFallbackHandlerAddress =
      this.factoryAddress === DEFAULT_BICONOMY_FACTORY_ADDRESS ? DEFAULT_FALLBACK_HANDLER_ADDRESS : biconomySmartAccountConfig.defaultFallbackHandler;
    if (!defaultFallbackHandlerAddress) {
      throw new Error("Default Fallback Handler address is not provided");
    }
    this.defaultFallbackHandlerAddress = defaultFallbackHandlerAddress;

    this.provider = createPublicClient({
      chain: getChain(biconomySmartAccountConfig.chainId),
      transport: http(biconomySmartAccountConfig.rpcUrl || getChain(biconomySmartAccountConfig.chainId).rpcUrls.public.http[0]),
    });

    this.scanForUpgradedAccountsFromV1 = biconomySmartAccountConfig.scanForUpgradedAccountsFromV1 ?? false;
    this.maxIndexForScan = biconomySmartAccountConfig.maxIndexForScan ?? 10;
  }

  /**
   * Creates a new instance of BiconomySmartAccountV2.
   *
   * This method will create a BiconomySmartAccountV2 instance but will not deploy the Smart Account.
   *
   * Deployment of the Smart Account will be donewith the first user operation.
   *
   * @param biconomySmartAccountConfig - Configuration for initializing the BiconomySmartAccountV2 instance.
   * @returns A promise that resolves to a new instance of BiconomySmartAccountV2.
   * @throws An error if something is wrong with the smart account instance creation.
   */
  public static async create(biconomySmartAccountConfig: BiconomySmartAccountV2Config): Promise<BiconomySmartAccountV2> {
    let chainId = biconomySmartAccountConfig.chainId;

    // Signer needs to be initialised here before defaultValidationModule is set
    if (biconomySmartAccountConfig.signer) {
      const signer = biconomySmartAccountConfig.signer;
      const isViemWalletClient = !(signer instanceof WalletClientSigner);
      if (isViemWalletClient) {
        const walletClient = signer as WalletClient;
        if (!walletClient.account) {
          throw new Error("Cannot consume a viem wallet without an account");
        }
        if (!walletClient.chain) {
          throw new Error("Cannot consume a viem wallet without a chainId");
        }
        chainId = walletClient.chain.id;
        biconomySmartAccountConfig.signer = new WalletClientSigner(walletClient, "viem");
      }
    }

    if (!chainId) {
      // Chain ID still not found
      throw new Error("chainId required");
    }

    let defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule;

    // Note: If no module is provided, we will use ECDSA_OWNERSHIP as default
    if (!defaultValidationModule) {
      const newModule = await ECDSAOwnershipValidationModule.create({
        // @ts-expect-error: Signer always present if no defaultValidationModule
        signer: biconomySmartAccountConfig.signer!,
      });
      defaultValidationModule = newModule;
    }
    const activeValidationModule = biconomySmartAccountConfig?.activeValidationModule ?? defaultValidationModule;
    const config = {
      ...biconomySmartAccountConfig,
      defaultValidationModule,
      activeValidationModule,
      chainId,
    };

    return new BiconomySmartAccountV2(config);
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
    if (this.accountAddress == null || this.accountAddress == undefined) {
      // means it needs deployment
      this.accountAddress = await this.getCounterFactualAddress(params);
    }
    return this.accountAddress;
  }

  /**
   * Return the account's address. This value is valid even before deploying the contract.
   */
  async getCounterFactualAddress(params?: CounterFactualAddressParam): Promise<Hex> {
    const validationModule = params?.validationModule ?? this.defaultValidationModule;
    const index = params?.index ?? this.index;

    const maxIndexForScan = params?.maxIndexForScan ?? this.maxIndexForScan;
    // Review: default behavior
    const scanForUpgradedAccountsFromV1 = params?.scanForUpgradedAccountsFromV1 ?? this.scanForUpgradedAccountsFromV1;

    // if it's intended to detect V1 upgraded accounts
    if (scanForUpgradedAccountsFromV1) {
      const eoaSigner = await validationModule.getSigner();
      const eoaAddress = (await eoaSigner.getAddress()) as Hex;
      const moduleAddress = validationModule.getAddress() as Hex;
      const moduleSetupData = (await validationModule.getInitData()) as Hex;
      const queryParams = {
        eoaAddress,
        index,
        moduleAddress,
        moduleSetupData,
        maxIndexForScan,
      };
      const accountAddress = await this.getV1AccountsUpgradedToV2(queryParams);
      if (accountAddress !== ADDRESS_ZERO) {
        return accountAddress;
      }
    }

    const counterFactualAddressV2 = await this.getCounterFactualAddressV2({ validationModule, index });
    return counterFactualAddressV2;
  }

  private async getCounterFactualAddressV2(params?: CounterFactualAddressParam): Promise<Hex> {
    const validationModule = params?.validationModule ?? this.defaultValidationModule;
    const index = params?.index ?? this.index;

    try {
      const initCalldata = encodeFunctionData({
        abi: BiconomyAccountAbi,
        functionName: "init",
        args: [this.defaultFallbackHandlerAddress, validationModule.getAddress() as Hex, (await validationModule.getInitData()) as Hex],
      });

      const proxyCreationCodeHash = keccak256(encodePacked(["bytes", "uint256"], [PROXY_CREATION_CODE, BigInt(this.implementationAddress)]));

      const salt = keccak256(encodePacked(["bytes32", "uint256"], [keccak256(initCalldata), BigInt(index)]));

      const counterFactualAddress = getCreate2Address({
        from: this.factoryAddress,
        salt: salt,
        bytecodeHash: proxyCreationCodeHash,
      });

      return counterFactualAddress;
    } catch (e) {
      throw new Error(`Failed to get counterfactual address, ${e}`);
    }
  }

  async _getAccountContract(): Promise<GetContractReturnType<typeof BiconomyAccountAbi, PublicClient, Chain>> {
    if (this.accountContract == null) {
      this.accountContract = getContract({
        address: await this.getAddress(),
        abi: BiconomyAccountAbi,
        publicClient: this.provider as PublicClient,
      });
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

  async getV1AccountsUpgradedToV2(params: QueryParamsForAddressResolver): Promise<Hex> {
    const maxIndexForScan = params.maxIndexForScan ?? this.maxIndexForScan;

    const addressResolver = getContract({
      address: ADDRESS_RESOLVER_ADDRESS,
      abi: AccountResolverAbi,
      publicClient: this.provider as PublicClient,
    });
    // Note: depending on moduleAddress and moduleSetupData passed call this. otherwise could call resolveAddresses()

    if (params.moduleAddress && params.moduleSetupData) {
      const result = await addressResolver.read.resolveAddressesFlexibleForV2([
        params.eoaAddress,
        maxIndexForScan,
        params.moduleAddress,
        params.moduleSetupData,
      ]);

      const desiredV1Account = result.find(
        (smartAccountInfo) =>
          smartAccountInfo.factoryVersion === "v1" &&
          smartAccountInfo.currentVersion === "2.0.0" &&
          Number(smartAccountInfo.deploymentIndex.toString()) === params.index,
      );

      if (desiredV1Account) {
        const smartAccountAddress = desiredV1Account.accountAddress;
        return smartAccountAddress;
      } else {
        return ADDRESS_ZERO;
      }
    } else {
      return ADDRESS_ZERO;
    }
  }

  /**
   * Return the value to put into the "initCode" field, if the account is not yet deployed.
   * This value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<Hex> {
    this.isDefaultValidationModuleDefined();

    return concatHex([
      this.factoryAddress as Hex,
      encodeFunctionData({
        abi: BiconomyFactoryAbi,
        functionName: "deployCounterFactualAccount",
        args: [this.defaultValidationModule.getAddress() as Hex, (await this.defaultValidationModule.getInitData()) as Hex, BigInt(this.index)],
      }),
    ]);
  }

  /**
   *
   * @param to { target } address of transaction
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns encoded data for execute function
   */
  async encodeExecute(to: Hex, value: bigint, data: Hex): Promise<Hex> {
    // return accountContract.interface.encodeFunctionData("execute_ncC", [to, value, data]) as Hex;
    return encodeFunctionData({
      abi: BiconomyAccountAbi,
      functionName: "execute_ncC",
      args: [to, value, data],
    });
  }

  /**
   *
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns encoded data for executeBatch function
   */
  async encodeExecuteBatch(to: Array<Hex>, value: Array<bigint>, data: Array<Hex>): Promise<Hex> {
    return encodeFunctionData({
      abi: BiconomyAccountAbi,
      functionName: "executeBatch_y6U",
      args: [to, value, data],
    });
  }

  override async encodeBatchExecute(txs: BatchUserOperationCallData): Promise<Hex> {
    const [targets, datas, value] = txs.reduce(
      (accum, curr) => {
        accum[0].push(curr.target);
        accum[1].push(curr.data);
        accum[2].push(curr.value || BigInt(0));

        return accum;
      },
      [[], [], []] as [Hex[], Hex[], bigint[]],
    );

    return this.encodeExecuteBatch(targets, value, datas);
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

  validateUserOp(userOp: Partial<UserOperationStruct>, requiredFields: UserOperationKey[]): boolean {
    for (const field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${String(field)} is missing in the UserOp`);
      }
    }
    return true;
  }

  async signUserOp(userOp: Partial<UserOperationStruct>, params?: SendUserOpParams): Promise<UserOperationStruct> {
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

    const signatureWithModuleAddress = this.getSignatureWithModuleAddress(moduleSig, this.activeValidationModule.getAddress() as Hex);

    userOp.signature = signatureWithModuleAddress;
    return userOp as UserOperationStruct;
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
  async sendUserOp(userOp: Partial<UserOperationStruct>, params?: SendUserOpParams): Promise<UserOpResponse> {
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
  async sendSignedUserOp(userOp: UserOperationStruct): Promise<UserOpResponse> {
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
    if (!this.bundler) throw new Error("Bundler is not provided");
    console.info("userOp being sent to the bundler", userOp);
    const bundlerResponse = await this.bundler.sendUserOp(userOp);
    return bundlerResponse;
  }

  async getUserOpHash(userOp: Partial<UserOperationStruct>): Promise<Hex> {
    const userOpHash = keccak256(packUserOp(userOp, true) as Hex);
    const enc = encodeAbiParameters(parseAbiParameters("bytes32, address, uint256"), [userOpHash, this.entryPoint.address, BigInt(this.chainId)]);
    return keccak256(enc);
  }

  async estimateUserOpGas(userOp: Partial<UserOperationStruct>): Promise<Partial<UserOperationStruct>> {
    if (!this.bundler) throw new Error("Bundler is not provided");
    const requiredFields: UserOperationKey[] = ["sender", "nonce", "initCode", "callData"];
    this.validateUserOp(userOp, requiredFields);

    const finalUserOp = userOp;

    // Making call to bundler to get gas estimations for userOp
    const { callGasLimit, verificationGasLimit, preVerificationGas, maxFeePerGas, maxPriorityFeePerGas } =
      await this.bundler.estimateUserOpGas(userOp);
    // if neither user sent gas fee nor the bundler, estimate gas from provider
    if (!userOp.maxFeePerGas && !userOp.maxPriorityFeePerGas && (!maxFeePerGas || !maxPriorityFeePerGas)) {
      const feeData = await this.provider.estimateFeesPerGas();
      if (feeData.maxFeePerGas?.toString()) {
        finalUserOp.maxFeePerGas = ("0x" + feeData.maxFeePerGas.toString(16)) as Hex;
      } else if (feeData.gasPrice?.toString()) {
        finalUserOp.maxFeePerGas = ("0x" + feeData.gasPrice.toString(16)) as Hex;
      } else {
        finalUserOp.maxFeePerGas = ("0x" + (await this.provider.getGasPrice()).toString(16)) as Hex;
      }

      if (feeData.maxPriorityFeePerGas?.toString()) {
        finalUserOp.maxPriorityFeePerGas = ("0x" + feeData.maxPriorityFeePerGas?.toString()) as Hex;
      } else if (feeData.gasPrice?.toString()) {
        finalUserOp.maxPriorityFeePerGas = toHex(Number(feeData.gasPrice?.toString()));
      } else {
        finalUserOp.maxPriorityFeePerGas = ("0x" + (await this.provider.getGasPrice()).toString(16)) as Hex;
      }
    } else {
      finalUserOp.maxFeePerGas = toHex(Number(maxFeePerGas)) ?? userOp.maxFeePerGas;
      finalUserOp.maxPriorityFeePerGas = toHex(Number(maxPriorityFeePerGas)) ?? userOp.maxPriorityFeePerGas;
    }
    finalUserOp.verificationGasLimit = toHex(Number(verificationGasLimit)) ?? userOp.verificationGasLimit;
    finalUserOp.callGasLimit = toHex(Number(callGasLimit)) ?? userOp.callGasLimit;
    finalUserOp.preVerificationGas = toHex(Number(preVerificationGas)) ?? userOp.preVerificationGas;
    finalUserOp.paymasterAndData = "0x";

    return finalUserOp;
  }

  // Could call it nonce space
  async getNonce(nonceKey?: number): Promise<bigint> {
    const nonceSpace = nonceKey ?? 0;
    try {
      const address = await this.getAddress();
      return await this.entryPoint.read.getNonce([address, BigInt(nonceSpace)]);
    } catch (e) {
      return BigInt(0);
    }
  }

  private async getBuildUserOpNonce(nonceOptions: NonceOptions | undefined): Promise<BigNumberish> {
    let nonce = BigInt(0);
    try {
      if (nonceOptions?.nonceOverride) {
        nonce = BigInt(nonceOptions?.nonceOverride);
      } else {
        const _nonceSpace = nonceOptions?.nonceKey ?? 0;
        nonce = await this.getNonce(_nonceSpace);
      }
    } catch (error) {
      // Not throwing this error as nonce would be 0 if this.getNonce() throw exception, which is expected flow for undeployed account
      console.info("Error while getting nonce for the account. This is expected for undeployed accounts set nonce to 0");
    }
    return nonce;
  }

  private async getGasFeeValues(
    overrides: Overrides | undefined,
    skipBundlerGasEstimation: boolean | undefined,
  ): Promise<{ maxFeePerGas?: string; maxPriorityFeePerGas?: string }> {
    const gasFeeValues = {
      maxFeePerGas: overrides?.maxFeePerGas as string,
      maxPriorityFeePerGas: overrides?.maxPriorityFeePerGas as string,
    };
    try {
      if (this.bundler && !gasFeeValues.maxFeePerGas && !gasFeeValues.maxPriorityFeePerGas && (skipBundlerGasEstimation ?? true)) {
        const gasFeeEstimation = await this.bundler.getGasFeeValues();
        gasFeeValues.maxFeePerGas = gasFeeEstimation.maxFeePerGas;
        gasFeeValues.maxPriorityFeePerGas = gasFeeEstimation.maxPriorityFeePerGas;
      }
      return gasFeeValues;
    } catch (error: any) {
      // TODO: should throw error here?
      console.error("Error while getting gasFeeValues from bundler. Provided bundler might not have getGasFeeValues endpoint", error);
      return gasFeeValues;
    }
  }

  /**
   * @param manyOrOneTransactions list of transactions, or single transaction for execution
   * @param buildUseropDto options for building the userOp
   * @returns Promise<UserOpResponse>
   */
  async sendTransaction(manyOrOneTransactions: Transaction | Transaction[], buildUseropDto?: BuildUserOpOptions) {
    const userOp = await this.buildUserOp(Array.isArray(manyOrOneTransactions) ? manyOrOneTransactions : [manyOrOneTransactions], buildUseropDto);
    return this.sendUserOp(userOp);
  }

  async buildUserOp(transactions: Transaction[], buildUseropDto?: BuildUserOpOptions): Promise<Partial<UserOperationStruct>> {
    const to = transactions.map((element: Transaction) => element.to as Hex);
    const data = transactions.map((element: Transaction) => (element.data as Hex) ?? "0x");
    const value = transactions.map((element: Transaction) => (element.value as bigint) ?? BigInt(0));

    const initCodeFetchPromise = this.getInitCode();
    const dummySignatureFetchPromise = this.getDummySignatures(buildUseropDto?.params);

    const [nonceFromFetch, initCode, signature] = await Promise.all([
      this.getBuildUserOpNonce(buildUseropDto?.nonceOptions),
      initCodeFetchPromise,
      dummySignatureFetchPromise,
    ]);

    if (transactions.length === 0) {
      throw new Error("Transactions array cannot be empty");
    }
    let callData: Hex = "0x";
    if (transactions.length > 1 || buildUseropDto?.forceEncodeForBatch) {
      callData = await this.encodeExecuteBatch(to, value, data);
    } else {
      // transactions.length must be 1
      callData = await this.encodeExecute(to[0], value[0], data[0]);
    }

    let userOp: Partial<UserOperationStruct> = {
      sender: (await this.getAccountAddress()) as Hex,
      nonce: toHex(nonceFromFetch),
      initCode,
      callData: callData,
    };

    // for this Smart Account current validation module dummy signature will be used to estimate gas
    userOp.signature = signature;

    // Note: Can change the default behaviour of calling estimations using bundler/local
    userOp = await this.estimateUserOpGas(userOp);
    userOp.paymasterAndData = userOp.paymasterAndData ?? "0x";
    console.log("UserOp after estimation ", userOp);

    return userOp;
  }

  private validateUserOpAndPaymasterRequest(userOp: Partial<UserOperationStruct>, tokenPaymasterRequest: BiconomyTokenPaymasterRequest): void {
    if (isNullOrUndefined(userOp.callData)) {
      throw new Error("UserOp callData cannot be undefined");
    }

    const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress;
    console.info("Requested fee token is ", feeTokenAddress);

    if (!feeTokenAddress || feeTokenAddress === ADDRESS_ZERO) {
      throw new Error("Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest");
    }

    const spender = tokenPaymasterRequest?.spender;
    console.info("Spender address is ", spender);

    if (!spender || spender === ADDRESS_ZERO) {
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
    userOp: Partial<UserOperationStruct>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
  ): Promise<Partial<UserOperationStruct>> {
    this.validateUserOpAndPaymasterRequest(userOp, tokenPaymasterRequest);
    try {
      let batchTo: Array<Hex> = [];
      let batchValue: Array<bigint> = [];
      let batchData: Array<Hex> = [];

      let newCallData = userOp.callData;
      console.info("Received information about fee token address and quote ", tokenPaymasterRequest);

      if (this.paymaster && this.paymaster instanceof BiconomyPaymaster) {
        // Make a call to paymaster.buildTokenApprovalTransaction() with necessary details

        // Review: might request this form of an array of Transaction
        const approvalRequest: Transaction = await (this.paymaster as IHybridPaymaster<SponsorUserOperationDto>).buildTokenApprovalTransaction(
          tokenPaymasterRequest,
        );
        console.info("ApprovalRequest is for erc20 token ", approvalRequest.to);

        if (approvalRequest.data === "0x" || approvalRequest.to === ADDRESS_ZERO) {
          return userOp;
        }

        if (isNullOrUndefined(userOp.callData)) {
          throw new Error("UserOp callData cannot be undefined");
        }

        const decodedSmartAccountData = decodeFunctionData({
          abi: BiconomyAccountAbi,
          data: userOp.callData as Hex,
        });

        if (!decodedSmartAccountData) {
          throw new Error("Could not parse userOp call data for this smart account");
        }

        const smartAccountExecFunctionName = decodedSmartAccountData.functionName;

        console.info(`Originally an ${smartAccountExecFunctionName} method call for Biconomy Account V2`);
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
          batchTo = [...methodArgsSmartWalletExecuteCall[0]];
          batchValue = [...methodArgsSmartWalletExecuteCall[1]];
          batchData = [...methodArgsSmartWalletExecuteCall[2]];
        }

        if (approvalRequest.to && approvalRequest.data && approvalRequest.value) {
          batchTo = [approvalRequest.to as Hex, ...batchTo];
          batchValue = [BigInt(Number(approvalRequest.value.toString())), ...batchValue];
          batchData = [approvalRequest.data as Hex, ...batchData];

          newCallData = await this.encodeExecuteBatch(batchTo, batchValue, batchData);
        }
        let finalUserOp: Partial<UserOperationStruct> = {
          ...userOp,
          callData: newCallData,
        };

        // Requesting to update gas limits again (especially callGasLimit needs to be re-calculated)
        try {
          finalUserOp = await this.estimateUserOpGas(finalUserOp);
          const callGasLimit = finalUserOp.callGasLimit;
          if (callGasLimit && hexToNumber(callGasLimit as Hex) < 21000) {
            return {
              ...userOp,
              callData: newCallData,
            };
          }
          console.info("UserOp after estimation ", finalUserOp);
        } catch (error) {
          console.error("Failed to estimate gas for userOp with updated callData ", error);
          console.log("Sending updated userOp. calculateGasLimit flag should be sent to the paymaster to be able to update callGasLimit");
        }
        return finalUserOp;
      }
    } catch (error) {
      console.log("Failed to update userOp. Sending back original op");
      console.error("Failed to update callData with error", error);
      return userOp;
    }
    return userOp;
  }

  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<Hex> {
    this.isActiveValidationModuleDefined();
    const moduleSig = (await this.activeValidationModule.signUserOpHash(userOpHash, params)) as Hex;

    const signatureWithModuleAddress = encodeAbiParameters(parseAbiParameters("bytes, address"), [
      moduleSig,
      this.activeValidationModule.getAddress() as Hex,
    ]);

    return signatureWithModuleAddress;
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    this.isActiveValidationModuleDefined();
    const dataHash = typeof message === "string" ? toBytes(message) : message;
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

  async enableModule(moduleAddress: Hex): Promise<UserOpResponse> {
    const tx: Transaction = await this.getEnableModuleData(moduleAddress);
    const partialUserOp = await this.buildUserOp([tx]);
    return this.sendUserOp(partialUserOp);
  }

  async getEnableModuleData(moduleAddress: Hex): Promise<Transaction> {
    const callData = encodeFunctionData({
      abi: BiconomyAccountAbi,
      functionName: "enableModule",
      args: [moduleAddress],
    });
    const tx: Transaction = {
      to: await this.getAddress(),
      value: "0x00",
      data: callData,
    };
    return tx;
  }

  async getSetupAndEnableModuleData(moduleAddress: Hex, moduleSetupData: Hex): Promise<Transaction> {
    const callData = encodeFunctionData({
      abi: BiconomyAccountAbi,
      functionName: "setupAndEnableModule",
      args: [moduleAddress, moduleSetupData],
    });
    const tx: Transaction = {
      to: await this.getAddress(),
      value: "0x00",
      data: callData,
    };
    return tx;
  }

  async disableModule(prevModule: Hex, moduleAddress: Hex): Promise<UserOpResponse> {
    const tx: Transaction = await this.getDisableModuleData(prevModule, moduleAddress);
    const partialUserOp = await this.buildUserOp([tx]);
    return this.sendUserOp(partialUserOp);
  }

  async getDisableModuleData(prevModule: Hex, moduleAddress: Hex): Promise<Transaction> {
    const callData = encodeFunctionData({
      abi: BiconomyAccountAbi,
      functionName: "disableModule",
      args: [prevModule, moduleAddress],
    });
    const tx: Transaction = {
      to: await this.getAddress(),
      value: "0x00",
      data: callData,
    };
    return tx;
  }

  async isModuleEnabled(moduleName: Hex): Promise<boolean> {
    const accountContract = await this._getAccountContract();
    return accountContract.read.isModuleEnabled([moduleName]);
  }

  // Review
  async getAllModules(pageSize?: number): Promise<Array<string>> {
    pageSize = pageSize ?? 100;
    const accountContract = await this._getAccountContract();
    const result = await accountContract.read.getModulesPaginated([this.SENTINEL_MODULE as Hex, BigInt(pageSize)]);
    const modules: Array<string> = result[0] as Array<string>;
    return modules;
  }
}
