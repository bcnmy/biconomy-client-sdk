import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { BigNumber, BigNumberish, BytesLike, ethers, Bytes } from "ethers";
import { IBaseSmartAccount } from "./interfaces/IBaseSmartAccount";
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import { UserOperation, ChainId } from "@biconomy/core-types";
import { calcPreVerificationGas, DefaultGasLimits } from "./utils/Preverificaiton";
import { NotPromise, packUserOp, Logger, RPC_PROVIDER_URLS } from "@biconomy/common";
import { IBundler, UserOpResponse } from "@biconomy/bundler";
import { IPaymaster, PaymasterAndDataResponse } from "@biconomy/paymaster";
import { SendUserOpParams } from "@biconomy/modules";
import { SponsorUserOperationDto, BiconomyPaymaster, PaymasterMode, IHybridPaymaster } from "@biconomy/paymaster";
import { BaseSmartAccountConfig, Overrides, TransactionDetailsForUserOp } from "./utils/Types";
import { GasOverheads } from "./utils/Preverificaiton";
import { EntryPoint, EntryPoint__factory } from "@account-abstraction/contracts";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "./utils/Constants";
import { LRUCache } from "lru-cache";

type UserOperationKey = keyof UserOperation;

export abstract class BaseSmartAccount implements IBaseSmartAccount {
  bundler?: IBundler; // httpRpcClient

  paymaster?: IPaymaster; // paymasterAPI

  overheads?: Partial<GasOverheads>;

  entryPointAddress!: string;

  accountAddress?: string;

  // owner?: Signer // owner is not mandatory for some account implementations
  index: number;

  chainId?: ChainId;

  provider: Provider;

  // entryPoint connected to "zero" address. allowed to make static calls (e.g. to getSenderAddress)
  private readonly entryPoint!: EntryPoint;

  private isContractDeployedCache = new LRUCache({
    max: 500,
  });

  constructor(_smartAccountConfig: BaseSmartAccountConfig) {
    this.index = _smartAccountConfig.index ?? 0;
    this.overheads = _smartAccountConfig.overheads;
    this.entryPointAddress = _smartAccountConfig.entryPointAddress ?? DEFAULT_ENTRYPOINT_ADDRESS;
    this.accountAddress = _smartAccountConfig.accountAddress;
    this.paymaster = _smartAccountConfig.paymaster;
    this.bundler = _smartAccountConfig.bundler;
    this.chainId = _smartAccountConfig.chainId;

    this.provider = _smartAccountConfig.provider ?? new JsonRpcProvider(RPC_PROVIDER_URLS[this.chainId]);

    // Create an instance of the EntryPoint contract using the provided address and provider (facory "connect" contract address)
    // Then, set the transaction's sender ("from" address) to the zero address (AddressZero). (contract "connect" from address)
    this.entryPoint = EntryPoint__factory.connect(this.entryPointAddress, this.provider).connect(ethers.constants.AddressZero);
  }

  async init(): Promise<this> {
    if (this.entryPointAddress === DEFAULT_ENTRYPOINT_ADDRESS) return this;
    if ((await this.provider.getCode(this.entryPointAddress)) === "0x") {
      throw new Error(`EntryPoint not deployed at ${this.entryPointAddress} at chainId ${this.chainId}}`);
    }
    return this;
  }

  setEntryPointAddress(entryPointAddress: string): void {
    this.entryPointAddress = entryPointAddress;
  }

  validateUserOp(userOp: Partial<UserOperation>, requiredFields: UserOperationKey[]): boolean {
    for (const field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${String(field)} is missing in the UserOp`);
      }
    }
    return true;
  }

  isProviderDefined(): boolean {
    if (!this.provider) throw new Error("Provider is undefined");

    return true;
  }

  /**
   * return the value to put into the "initCode" field, if the contract is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  abstract getAccountInitCode(): Promise<string>;

  /**
   * return current account's nonce.
   */
  abstract getNonce(): Promise<BigNumber>;

  /**
   * encode the call from entryPoint through our account to the target contract.
   * @param to
   * @param value
   * @param data
   */
  abstract encodeExecute(_to: string, _value: BigNumberish, _data: BytesLike): Promise<string>;

  /**
   * encode the batch call from entryPoint through our account to the target contract.
   * @param to
   * @param value
   * @param data
   */
  abstract encodeExecuteBatch(_to: Array<string>, _value: Array<BigNumberish>, _data: Array<BytesLike>): Promise<string>;

  /**
   * sign a userOp's hash (userOpHash).
   * @param userOpHash
   */
  abstract signUserOpHash(_userOpHash: string): Promise<string>;

  abstract signMessage(_message: Bytes | string): Promise<string>;

  /**
   * get dummy signature for userOp
   */
  abstract getDummySignature(): Promise<string>;

  /**
   * Sign the filled userOp.
   * @param userOp the UserOperation to sign (with signature field ignored)
   */
  async signUserOp(userOp: Partial<UserOperation>): Promise<UserOperation> {
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
    let signature = await this.signUserOpHash(userOpHash);

    // Some signers do not return signed data with 0x prefix. make sure the v value is 27/28 instead of 0/1
    // Also split sig and add +27 to v is v is only 0/1. then stitch it back

    // Note: Should only be applied for ECDSA k1 signatures
    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = signature.slice(0, -2) + correctV.toString(16);
    }
    if (signature.slice(0, 2) !== "0x") {
      signature = "0x" + signature;
    }

    userOp.signature = signature;
    return userOp as UserOperation;
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'unsignedUserOp' as an input, sign it with the owner key, and send it to the bundler.
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: Partial<UserOperation>): Promise<UserOpResponse> {
    Logger.log("userOp received in base account ", userOp);
    delete userOp.signature;
    const userOperation = await this.signUserOp(userOp);
    const bundlerResponse = await this.sendSignedUserOp(userOperation);
    return bundlerResponse;
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'signedUserOp' as input and send it to the bundler
   * @returns
   */
  async sendSignedUserOp(userOp: UserOperation, params?: SendUserOpParams): Promise<UserOpResponse> {
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
    const bundlerResponse = await this.bundler.sendUserOp(userOp, params?.simulationType);
    return bundlerResponse;
  }

  async calculateUserOpGasValues(userOp: Partial<UserOperation>): Promise<Partial<UserOperation>> {
    if (!this.provider) throw new Error("Provider is not present for making rpc calls");
    let feeData = null;

    if (
      userOp.maxFeePerGas === undefined ||
      userOp.maxFeePerGas === null ||
      userOp.maxPriorityFeePerGas === undefined ||
      userOp.maxPriorityFeePerGas === null
    ) {
      feeData = await this.provider.getFeeData();
    }

    if (userOp.maxFeePerGas === undefined || userOp.maxFeePerGas === null) {
      userOp.maxFeePerGas = feeData?.maxFeePerGas ?? feeData?.gasPrice ?? (await this.provider.getGasPrice());
    }

    if (userOp.maxPriorityFeePerGas === undefined || userOp.maxPriorityFeePerGas === null) {
      userOp.maxPriorityFeePerGas = feeData?.maxPriorityFeePerGas ?? feeData?.gasPrice ?? (await this.provider.getGasPrice());
    }
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

  // TODO // Should make this a Dto
  async estimateUserOpGas(
    userOp: Partial<UserOperation>,
    overrides?: Overrides,
    skipBundlerGasEstimation?: boolean,
    paymasterServiceData?: SponsorUserOperationDto,
  ): Promise<Partial<UserOperation>> {
    const requiredFields: UserOperationKey[] = ["sender", "nonce", "initCode", "callData"];
    this.validateUserOp(userOp, requiredFields);

    const finalUserOp = userOp;
    // const skipBundlerCall = skipBundlerGasEstimation ?? true;
    // Override gas values in userOp if provided in overrides params
    if (overrides) {
      userOp = { ...userOp, ...overrides };
    }

    Logger.log("userOp in estimation", userOp);

    if (this.paymaster && this.paymaster instanceof BiconomyPaymaster && paymasterServiceData?.mode === PaymasterMode.SPONSORED) {
      if (!userOp.maxFeePerGas && !userOp.maxPriorityFeePerGas) {
        throw new Error("maxFeePerGas and maxPriorityFeePerGas are required for skipBundlerCall mode");
      }
      // Making call to paymaster to get gas estimations for userOp
      const { callGasLimit, verificationGasLimit, preVerificationGas, paymasterAndData } = await (
        this.paymaster as IHybridPaymaster<SponsorUserOperationDto>
      ).getPaymasterAndData(userOp, paymasterServiceData);
      finalUserOp.verificationGasLimit = verificationGasLimit ?? userOp.verificationGasLimit;
      finalUserOp.callGasLimit = callGasLimit ?? userOp.callGasLimit;
      finalUserOp.preVerificationGas = preVerificationGas ?? userOp.preVerificationGas;
      finalUserOp.paymasterAndData = paymasterAndData ?? userOp.paymasterAndData;
    } else {
      if (!this.bundler) throw new Error("Bundler is not provided");
      // TODO: is this still needed to delete?
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
      finalUserOp.paymasterAndData = "0x";
    }
    return finalUserOp;
  }

  // Would only be used if paymaster is attached
  async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
    if (this.paymaster) {
      const paymasterAndDataResponse: PaymasterAndDataResponse = await this.paymaster.getPaymasterAndData(userOp);
      return paymasterAndDataResponse.paymasterAndData;
    }
    return "0x";
  }

  async isAccountDeployed(address: string): Promise<boolean> {
    if (this.isContractDeployedCache.get(address)) {
      return true;
    }

    this.isProviderDefined();
    let isDeployed = false;
    const contractCode = await this.provider.getCode(address);
    if (contractCode.length > 2) {
      this.isContractDeployedCache.set(address, true);
      isDeployed = true;
    } else {
      isDeployed = false;
    }
    return isDeployed;
  }

  /**
   * calculate the account address even before it is deployed
   */
  async getCounterFactualAddress(): Promise<string> {
    const initCode = this.getAccountInitCode();
    // use entryPoint to query account address (factory can provide a helper method to do the same, but
    // this method attempts to be generic
    try {
      await this.entryPoint.callStatic.getSenderAddress(initCode);
    } catch (e: any) {
      if (e.errorArgs == null) {
        throw e;
      }
      return e.errorArgs.sender;
    }
    throw new Error("must handle revert");
  }

  /**
   * return initCode value to into the UserOp.
   * (either deployment code, or empty hex if contract already deployed)
   */
  async getInitCode(): Promise<string> {
    if (await this.isAccountDeployed(await this.getAccountAddress())) {
      return "0x";
    }
    return this.getAccountInitCode();
  }

  async getPreVerificationGas(userOp: Partial<UserOperation>): Promise<BigNumber> {
    return calcPreVerificationGas(userOp);
  }

  async getVerificationGasLimit(initCode: BytesLike): Promise<BigNumber> {
    // Verification gas should be max(initGas(wallet deployment) + validateUserOp + validatePaymasterUserOp , postOp)

    const initGas = await this.estimateCreationGas(initCode as string);
    const validateUserOpGas = BigNumber.from(DefaultGasLimits.validatePaymasterUserOpGas + DefaultGasLimits.validateUserOpGas);
    const postOpGas = BigNumber.from(DefaultGasLimits.postOpGas);

    let verificationGasLimit = BigNumber.from(validateUserOpGas).add(initGas);

    if (BigNumber.from(postOpGas).gt(verificationGasLimit)) {
      verificationGasLimit = postOpGas;
    }
    return verificationGasLimit;
  }

  /**
   * return the account's address.
   * this value is valid even before deploying the contract.
   */
  async getAccountAddress(): Promise<string> {
    if (this.accountAddress == null) {
      // means it needs deployment
      this.accountAddress = await this.getCounterFactualAddress();
    }
    return this.accountAddress;
  }

  async estimateCreationGas(initCode?: string): Promise<BigNumberish> {
    if (initCode == null || initCode === "0x") return 0;
    const deployerAddress = initCode.substring(0, 42);
    const deployerCallData = "0x" + initCode.substring(42);
    return this.provider.estimateGas({ to: deployerAddress, data: deployerCallData });
  }

  /**
   * get the transaction that has this userOpHash mined, or null if not found
   * @param userOpHash returned by sendUserOpToBundler (or by getUserOpHash..)
   * @param timeout stop waiting after this timeout
   * @param interval time to wait between polls.
   * @return the transactionHash this userOp was mined, or null if not found.
   */
  async getUserOpReceipt(userOpHash: string, timeout = 30000, interval = 5000): Promise<string | null> {
    const endtime = Date.now() + timeout;
    while (Date.now() < endtime) {
      const events = await this.entryPoint.queryFilter(this.entryPoint.filters.UserOperationEvent(userOpHash));
      if (events.length > 0) {
        return events[0].transactionHash;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return null;
  }

  async getUserOpHash(userOp: Partial<UserOperation>): Promise<string> {
    const userOpHash = keccak256(packUserOp(userOp, true));
    const enc = defaultAbiCoder.encode(["bytes32", "address", "uint256"], [userOpHash, this.entryPoint.address, this.chainId]);
    return keccak256(enc);
  }

  /**
   * ABI-encode a user operation. used for calldata cost estimation
   */
  packUserOp(userOp: NotPromise<UserOperation>): string {
    return packUserOp(userOp, false);
  }

  async encodeUserOpCallDataAndGasLimit(detailsForUserOp: TransactionDetailsForUserOp): Promise<{ callData: string; callGasLimit: BigNumber }> {
    function parseNumber(a: any): BigNumber | null {
      if (a == null || a === "") return null;
      return BigNumber.from(a.toString());
    }

    const value = parseNumber(detailsForUserOp.value) ?? BigNumber.from(0);
    const callData = await this.encodeExecute(detailsForUserOp.target, value, detailsForUserOp.data);

    const callGasLimit =
      parseNumber(detailsForUserOp.gasLimit) ??
      (await this.provider.estimateGas({
        from: this.entryPointAddress,
        to: this.getAccountAddress(),
        data: callData,
      }));

    return {
      callData,
      callGasLimit,
    };
  }

  /**
   * helper method: create and sign a user operation.
   * @param info transaction details for the userOp
   */
  async createSignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperation> {
    Logger.log("createSignedUserOp called with info", info);
    throw new Error("Not implemented. Please use buildUserOp/buildUserOperation in account implementation");
  }
}
