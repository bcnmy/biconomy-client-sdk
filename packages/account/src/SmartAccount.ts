import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, Signer, BytesLike } from "ethers";
import { ISmartAccount } from "./interfaces/ISmartAccount";
import { defaultAbiCoder, keccak256, arrayify } from "ethers/lib/utils";
import { UserOperation, ChainId } from "@biconomy/core-types";
import { calcPreVerificationGas, DefaultGasLimits } from "./utils/Preverificaiton";
import { packUserOp } from "@biconomy/common";

import { IBundler, UserOpResponse } from "@biconomy/bundler";
import { IPaymaster, PaymasterAndDataResponse } from "@biconomy/paymaster";
import { Logger } from "@biconomy/common";
import { IEntryPoint } from "@account-abstraction/contracts";
import { SponsorUserOperationDto, BiconomyPaymaster, IHybridPaymaster, PaymasterMode } from "@biconomy/paymaster";
import { SmartAccountConfig, SendUserOpDto, EstimateUserOpGasParams } from "./utils/Types";

type UserOperationKey = keyof UserOperation;

// Notice: only to be used as base class for child class BiconomySmartAccount(V1)
export abstract class SmartAccount implements ISmartAccount {
  bundler!: IBundler;

  paymaster!: IPaymaster;

  initCode = "0x";

  // Ideally proxy should be defined in child class, if it's meant to be of type Biconomy SmartAccount
  proxy!: any;

  owner!: string;

  provider!: JsonRpcProvider;

  entryPoint!: IEntryPoint;

  chainId!: ChainId;

  signer!: Signer;

  smartAccountConfig: SmartAccountConfig;

  constructor(_smartAccountConfig: SmartAccountConfig) {
    this.smartAccountConfig = _smartAccountConfig;
  }

  setEntryPointAddress(entryPointAddress: string): void {
    this.smartAccountConfig.entryPointAddress = entryPointAddress;
  }

  private validateUserOp(userOp: Partial<UserOperation>, requiredFields: UserOperationKey[]): boolean {
    for (const field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${String(field)} is missing in the UserOp`);
      }
    }
    return true;
  }

  isProxyDefined(): boolean {
    if (!this.proxy) throw new Error("Proxy is undefined");

    return true;
  }

  isSignerDefined(): boolean {
    if (!this.signer) throw new Error("Signer is undefined");

    return true;
  }

  isProviderDefined(): boolean {
    if (!this.provider) throw new Error("Provider is undefined");

    return true;
  }

  abstract getDummySignature(): string;

  async calculateUserOpGasValues(userOp: Partial<UserOperation>): Promise<Partial<UserOperation>> {
    if (!this.provider) throw new Error("Provider is not present for making rpc calls");
    const feeData = await this.provider.getFeeData();
    userOp.maxFeePerGas = userOp.maxFeePerGas ?? feeData.maxFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice());
    userOp.maxPriorityFeePerGas =
      userOp.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice());
    if (userOp.initCode)
      userOp.verificationGasLimit =
        userOp.verificationGasLimit !== null || userOp.verificationGasLimit !== undefined
          ? userOp.verificationGasLimit
          : await this.getVerificationGasLimit(userOp.initCode);
    userOp.callGasLimit =
      userOp.callGasLimit !== null || userOp.callGasLimit !== undefined
        ? userOp.callGasLimit
        : await this.provider.estimateGas({
            from: this.smartAccountConfig.entryPointAddress,
            to: userOp.sender,
            data: userOp.callData,
          });
    userOp.preVerificationGas =
      userOp.preVerificationGas !== null || userOp.preVerificationGas !== undefined ? userOp.preVerificationGas : this.getPreVerificationGas(userOp);
    return userOp;
  }

  async estimateUserOpGas(params: EstimateUserOpGasParams): Promise<Partial<UserOperation>> {
    let userOp = params.userOp;
    const { overrides, skipBundlerGasEstimation, paymasterServiceData } = params;
    const requiredFields: UserOperationKey[] = ["sender", "nonce", "initCode", "callData"];
    this.validateUserOp(userOp, requiredFields);

    let finalUserOp = userOp;
    const skipBundlerCall = skipBundlerGasEstimation ?? true;
    // Override gas values in userOp if provided in overrides params
    if (overrides) {
      userOp = { ...userOp, ...overrides };
    }

    Logger.log("userOp in estimation", userOp);

    if (skipBundlerCall) {
      if (this.paymaster && this.paymaster instanceof BiconomyPaymaster) {
        if (!userOp.maxFeePerGas && !userOp.maxPriorityFeePerGas) {
          throw new Error("maxFeePerGas and maxPriorityFeePerGas are required for skipBundlerCall mode");
        }
        if (paymasterServiceData?.mode === PaymasterMode.SPONSORED) {
          const v1BiconomyInfo = {
            name: "BICONOMY",
            version: "1.0.0",
          };
          const smartAccountInfo = paymasterServiceData?.smartAccountInfo ?? v1BiconomyInfo;
          paymasterServiceData.smartAccountInfo = smartAccountInfo;

          // Making call to paymaster to get gas estimations for userOp
          const { callGasLimit, verificationGasLimit, preVerificationGas, paymasterAndData } = await (
            this.paymaster as IHybridPaymaster<SponsorUserOperationDto>
          ).getPaymasterAndData(userOp, paymasterServiceData);
          finalUserOp.verificationGasLimit = verificationGasLimit ?? userOp.verificationGasLimit;
          finalUserOp.callGasLimit = callGasLimit ?? userOp.callGasLimit;
          finalUserOp.preVerificationGas = preVerificationGas ?? userOp.preVerificationGas;
          finalUserOp.paymasterAndData = paymasterAndData ?? userOp.paymasterAndData;
        } else {
          // do we explicitly check for mode = TOKEN?
          // use dummy values for gas limits as fee quote call will ignore this later.
          finalUserOp.callGasLimit = 800000;
          finalUserOp.verificationGasLimit = 1000000;
          finalUserOp.preVerificationGas = 100000;
        }
      } else {
        Logger.warn("Skipped paymaster call. If you are using paymasterAndData, generate data externally");
        finalUserOp = await this.calculateUserOpGasValues(userOp);
        finalUserOp.paymasterAndData = "0x";
      }
    } else {
      if (!this.bundler) throw new Error("Bundler is not provided");
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

  async isAccountDeployed(address: string): Promise<boolean> {
    this.isProviderDefined();
    const contractCode = await this.provider.getCode(address);
    return contractCode !== "0x";
  }

  // Would only be used if paymaster is attached
  async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
    if (this.paymaster) {
      const paymasterAndDataResponse: PaymasterAndDataResponse = await this.paymaster.getPaymasterAndData(userOp);
      return paymasterAndDataResponse.paymasterAndData;
    }
    return "0x";
  }

  nonce(): Promise<BigNumber> {
    this.isProxyDefined();
    return this.proxy.nonce();
  }

  async signUserOpHash(userOpHash: string, signer?: Signer): Promise<string> {
    if (signer) {
      return signer.signMessage(arrayify(userOpHash));
    }
    if (this.signer) {
      return this.signer.signMessage(arrayify(userOpHash));
    }
    throw new Error("No signer provided to sign userOp");
  }

  getPreVerificationGas(userOp: Partial<UserOperation>): BigNumber {
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

  async getUserOpHash(userOp: Partial<UserOperation>): Promise<string> {
    const userOpHash = keccak256(packUserOp(userOp, true));
    const enc = defaultAbiCoder.encode(["bytes32", "address", "uint256"], [userOpHash, this.entryPoint.address, this.chainId]);
    return keccak256(enc);
  }

  abstract getSmartAccountAddress(_accountIndex: number): Promise<string>;

  async estimateCreationGas(initCode: string): Promise<BigNumber> {
    if (initCode == null || initCode === "0x") return BigNumber.from("0");
    const deployerAddress = initCode.substring(0, 42);
    const deployerCallData = "0x" + initCode.substring(42);
    return this.provider.estimateGas({ to: deployerAddress, data: deployerCallData });
  }

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
    let signature = await this.signUserOpHash(userOpHash, this.signer);
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
  async sendUserOp(userOp: Partial<UserOperation>, params?: SendUserOpDto): Promise<UserOpResponse> {
    Logger.log("userOp received in base account ", userOp);
    delete userOp.signature;
    const userOperation = await this.signUserOp(userOp);
    const bundlerResponse = await this.sendSignedUserOp(userOperation, params);
    return bundlerResponse;
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'signedUserOp' as input and send it to the bundler
   * @returns
   */
  async sendSignedUserOp(userOp: UserOperation, params?: SendUserOpDto): Promise<UserOpResponse> {
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
}
