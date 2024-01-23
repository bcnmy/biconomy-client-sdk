import { encodeFunctionData, parseAbi } from "viem";
import type { BigNumberish, UserOperationStruct } from "@biconomy/common";
import {
  PaymasterFeeQuote,
  PaymasterConfig,
  FeeQuotesOrDataResponse,
  FeeQuotesOrDataDto,
  SponsorUserOperationDto,
  JsonRpcResponse,
  BiconomyTokenPaymasterRequest,
  PaymasterMode,
  PaymasterAndDataResponse,
  Transaction,
  Hex,
} from "./utils/Types";
import { IHybridPaymaster } from "./interfaces/IHybridPaymaster";
import { MAX_UINT256, ERC20_ABI, ADDRESS_ZERO } from "./utils/Constants";
import { sendRequest, HttpMethod, Logger } from "@biconomy/common";
import { getTimestampInSeconds } from "./utils/Helpers";

const defaultPaymasterConfig: PaymasterConfig = {
  paymasterUrl: "",
  strictMode: false, // Set your desired default value for strictMode here
};
/**
 * @dev Hybrid - Generic Gas Abstraction paymaster
 */
export class BiconomyPaymaster implements IHybridPaymaster<SponsorUserOperationDto> {
  paymasterConfig: PaymasterConfig;

  constructor(config: PaymasterConfig) {
    const mergedConfig: PaymasterConfig = {
      ...defaultPaymasterConfig,
      ...config,
    };
    this.paymasterConfig = mergedConfig;
  }

  /**
   * @dev Prepares the user operation by resolving properties and converting certain values to hexadecimal format.
   * @param userOp The partial user operation.
   * @returns A Promise that resolves to the prepared partial user operation.
   */
  private async prepareUserOperation(userOp: Partial<UserOperationStruct>): Promise<Partial<UserOperationStruct>> {
    const userOperation = { ...userOp };
    try {
      const keys1: (keyof UserOperationStruct)[] = ["nonce", "maxFeePerGas", "maxPriorityFeePerGas"];
      for (const key of keys1) {
        if (userOperation[key] && userOperation[key] !== "0x") {
          userOperation[key] = ("0x" + BigInt(userOp[key] as BigNumberish).toString(16)) as `0x${string}`;
        }
      }
      const keys2: (keyof UserOperationStruct)[] = ["callGasLimit", "verificationGasLimit", "preVerificationGas"];
      for (const key of keys2) {
        if (userOperation[key] && userOperation[key] !== "0x") {
          userOperation[key] = BigInt(userOp[key] as BigNumberish).toString() as `0x${string}`;
        }
      }
    } catch (error) {
      throw `Failed to transform user operation: ${error}`;
    }
    userOperation.signature = userOp.signature || "0x";
    userOperation.paymasterAndData = userOp.paymasterAndData || "0x";
    return userOperation;
  }

  /**
   * @dev Builds a token approval transaction for the Biconomy token paymaster.
   * @param tokenPaymasterRequest The token paymaster request data. This will include information about chosen feeQuote, spender address and optional flag to provide maxApproval
   * @param provider Optional provider object.
   * @returns A Promise that resolves to the built transaction object.
   */
  async buildTokenApprovalTransaction(tokenPaymasterRequest: BiconomyTokenPaymasterRequest): Promise<Transaction> {
    const feeTokenAddress: string = tokenPaymasterRequest.feeQuote.tokenAddress;

    const spender = tokenPaymasterRequest.spender;

    // logging provider object isProvider
    // Logger.log("provider object passed - is provider", provider?._isProvider);

    // TODO move below notes to separate method
    // Note: should also check in caller if the approval is already given, if yes return object with address or data 0
    // Note: we would need userOp here to get the account/owner info to check allowance

    let requiredApproval = BigInt(0);

    if (tokenPaymasterRequest.maxApproval && tokenPaymasterRequest.maxApproval == true) {
      requiredApproval = BigInt(MAX_UINT256);
    } else {
      requiredApproval = BigInt(Math.ceil(tokenPaymasterRequest.feeQuote.maxGasFee * Math.pow(10, tokenPaymasterRequest.feeQuote.decimal)));
    }

    try {
      const parsedAbi = parseAbi(ERC20_ABI);
      const data = encodeFunctionData({
        abi: parsedAbi,
        functionName: "approve",
        args: [spender, requiredApproval],
      });

      // TODO?
      // Note: For some tokens we may need to set allowance to 0 first so that would return batch of transactions and changes the return type to Transaction[]
      // In that case we would return two objects in an array, first of them being..
      /*
    {
      to: erc20.address,
      value: ethers.BigNumber.from(0),
      data: erc20.interface.encodeFunctionData('approve', [spender, BigNumber.from("0")])
    }
    */

      // const zeroValue: ethers.BigNumber = ethers.BigNumber.from(0);
      // const value: BigNumberish | undefined = zeroValue as any;
      return {
        to: feeTokenAddress,
        value: "0x00",
        data: data,
      };
    } catch (error) {
      throw new Error("Failed to encode function data");
    }
  }

  /**
   * @dev Retrieves paymaster fee quotes or data based on the provided user operation and paymaster service data.
   * @param userOp The partial user operation.
   * @param paymasterServiceData The paymaster service data containing token information and sponsorship details. Devs can send just the preferred token or array of token addresses in case of mode "ERC20" and sartAccountInfo in case of "sponsored" mode.
   * @returns A Promise that resolves to the fee quotes or data response.
   */
  async getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperationStruct>,
    paymasterServiceData: FeeQuotesOrDataDto,
  ): Promise<FeeQuotesOrDataResponse> {
    userOp = await this.prepareUserOperation(userOp);

    let mode = null;
    let expiryDuration = null;
    const calculateGasLimits = paymasterServiceData.calculateGasLimits ?? true;
    let preferredToken = null;
    let feeTokensArray: string[] = [];
    // could make below null
    let smartAccountInfo = {
      name: "BICONOMY",
      version: "2.0.0",
    };
    let webhookData = null;

    if (paymasterServiceData.mode) {
      mode = paymasterServiceData.mode;
      // Validation on the mode passed / define allowed enums
    }

    if (paymasterServiceData.expiryDuration) {
      expiryDuration = paymasterServiceData.expiryDuration;
    }

    preferredToken = paymasterServiceData?.preferredToken ? paymasterServiceData?.preferredToken : preferredToken;

    feeTokensArray = (paymasterServiceData?.tokenList?.length !== 0 ? paymasterServiceData?.tokenList : feeTokensArray) as string[];

    webhookData = paymasterServiceData?.webhookData ?? webhookData;

    smartAccountInfo = paymasterServiceData?.smartAccountInfo ?? smartAccountInfo;

    try {
      const response: JsonRpcResponse = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: "pm_getFeeQuoteOrData",
          params: [
            userOp,
            {
              ...(mode !== null && { mode }),
              calculateGasLimits: calculateGasLimits,
              ...(expiryDuration !== null && { expiryDuration }),
              tokenInfo: {
                tokenList: feeTokensArray,
                ...(preferredToken !== null && { preferredToken }),
              },
              sponsorshipInfo: {
                ...(webhookData !== null && { webhookData }),
                smartAccountInfo: smartAccountInfo,
              },
            },
          ], // As per current API
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      });

      if (response && response.result) {
        if (response.result.mode == PaymasterMode.ERC20) {
          const feeQuotesResponse: Array<PaymasterFeeQuote> = response.result.feeQuotes;
          const paymasterAddress: Hex = response.result.paymasterAddress;
          // check all objects iterate and populate below calculation for all tokens
          return { feeQuotes: feeQuotesResponse, tokenPaymasterAddress: paymasterAddress };
        } else if (response.result.mode == PaymasterMode.SPONSORED) {
          const paymasterAndData: Hex = response.result.paymasterAndData;
          const preVerificationGas = response.result.preVerificationGas;
          const verificationGasLimit = response.result.verificationGasLimit;
          const callGasLimit = response.result.callGasLimit;
          return {
            paymasterAndData: paymasterAndData,
            preVerificationGas: preVerificationGas,
            verificationGasLimit: verificationGasLimit,
            callGasLimit: callGasLimit,
          };
        } else {
          const errorObject = {
            code: 417,
            message: "Expectation Failed: Invalid mode in Paymaster service response",
          };
          throw errorObject;
        }
      }
    } catch (error: any) {
      Logger.error("Failed to fetch Fee Quotes or Paymaster data - reason: ", JSON.stringify(error));
      // Note: we may not throw if we include strictMode off and return paymasterData '0x'.
      if (
        !this.paymasterConfig.strictMode &&
        paymasterServiceData.mode == PaymasterMode.SPONSORED &&
        (error?.message.includes("Smart contract data not found") || error?.message.includes("No policies were set"))
        // can also check based on error.code being -32xxx
      ) {
        Logger.warn(`Strict mode is ${this.paymasterConfig.strictMode}. sending paymasterAndData 0x`);
        return {
          paymasterAndData: "0x",
          // send below values same as userOp gasLimits
          preVerificationGas: userOp.preVerificationGas,
          verificationGasLimit: userOp.verificationGasLimit,
          callGasLimit: userOp.callGasLimit,
        };
      }
      throw error;
    }
    throw new Error("Failed to fetch feeQuote or paymaster data");
  }

  /**
   * @dev Retrieves the paymaster and data based on the provided user operation and paymaster service data.
   * @param userOp The partial user operation.
   * @param paymasterServiceData Optional paymaster service data.
   * @returns A Promise that resolves to the paymaster and data string.
   */
  async getPaymasterAndData(
    userOp: Partial<UserOperationStruct>,
    paymasterServiceData?: SponsorUserOperationDto, // mode is necessary. partial context of token paymaster or verifying
  ): Promise<PaymasterAndDataResponse> {
    userOp = await this.prepareUserOperation(userOp);

    if (paymasterServiceData?.mode === undefined) {
      throw new Error("mode is required in paymasterServiceData");
    }

    const mode = paymasterServiceData.mode;

    const calculateGasLimits = paymasterServiceData.calculateGasLimits ?? true;

    let tokenInfo = null;
    let expiryDuration = null;
    // could make below null
    let smartAccountInfo = {
      name: "BICONOMY",
      version: "2.0.0",
    };
    let webhookData = null;

    if (mode === PaymasterMode.ERC20) {
      if (!paymasterServiceData?.feeTokenAddress && paymasterServiceData?.feeTokenAddress === ADDRESS_ZERO) {
        throw new Error("feeTokenAddress is required and should be non-zero");
      }
      tokenInfo = {
        feeTokenAddress: paymasterServiceData.feeTokenAddress,
      };
    }

    webhookData = paymasterServiceData?.webhookData ?? webhookData;
    smartAccountInfo = paymasterServiceData?.smartAccountInfo ?? smartAccountInfo;
    expiryDuration = paymasterServiceData?.expiryDuration ?? expiryDuration;

    // Note: The idea is before calling this below rpc, userOp values presense and types should be in accordance with how we call eth_estimateUseropGas on the bundler

    try {
      const response: JsonRpcResponse = await sendRequest({
        url: `${this.paymasterConfig.paymasterUrl}`,
        method: HttpMethod.Post,
        body: {
          method: "pm_sponsorUserOperation",
          params: [
            userOp,
            {
              mode: mode,
              calculateGasLimits: calculateGasLimits,
              ...(expiryDuration !== null && { expiryDuration }),
              ...(tokenInfo !== null && { tokenInfo }),
              sponsorshipInfo: {
                ...(webhookData !== null && { webhookData }),
                smartAccountInfo: smartAccountInfo,
              },
            },
          ],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      });

      if (response && response.result) {
        const paymasterAndData = response.result.paymasterAndData;
        const preVerificationGas = response.result.preVerificationGas;
        const verificationGasLimit = response.result.verificationGasLimit;
        const callGasLimit = response.result.callGasLimit;
        return {
          paymasterAndData: paymasterAndData,
          preVerificationGas: preVerificationGas,
          verificationGasLimit: verificationGasLimit,
          callGasLimit: callGasLimit,
        };
      }
    } catch (error: any) {
      Logger.error("Error in generating paymasterAndData - reason: ", JSON.stringify(error));
      throw error;
    }
    throw new Error("Error in generating paymasterAndData");
  }

  /**
   *
   * @param userOp user operation
   * @param paymasterServiceData optional extra information to be passed to paymaster service
   * @returns paymasterAndData with valid length but mock signature
   */
  async getDummyPaymasterAndData(
    _userOp: Partial<UserOperationStruct>,
    _paymasterServiceData?: SponsorUserOperationDto, // mode is necessary. partial context of token paymaster or verifying
  ): Promise<string> {
    return "0x";
  }
}
