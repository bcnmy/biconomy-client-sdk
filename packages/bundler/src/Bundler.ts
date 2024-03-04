import { getChain, type UserOperationStruct } from "@alchemy/aa-core";
import { createPublicClient, http, PublicClient } from "viem";
import { IBundler } from "./interfaces/IBundler.js";
import {
  GetUserOperationReceiptResponse,
  GetUserOpByHashResponse,
  Bundlerconfig,
  UserOpResponse,
  EstimateUserOpGasResponse,
  UserOpReceipt,
  SendUserOpResponse,
  UserOpGasResponse,
  UserOpByHashResponse,
  GetGasFeeValuesResponse,
  GasFeeValues,
  UserOpStatus,
  GetUserOperationStatusResponse,
  SimulationType,
  BundlerConfigWithChainId,
} from "./utils/Types.js";
import { transformUserOP, getTimestampInSeconds } from "./utils/HelperFunction.js";
import {
  UserOpReceiptIntervals,
  UserOpWaitForTxHashIntervals,
  UserOpWaitForTxHashMaxDurationIntervals,
  UserOpReceiptMaxDurationIntervals,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "./utils/Constants.js";
import { extractChainIdFromBundlerUrl } from "./utils/Utils.js";
import { sendRequest, HttpMethod, StateOverrideSet } from "@biconomy/common";

/**
 * This class implements IBundler interface.
 * Implementation sends UserOperation to a bundler URL as per ERC4337 standard.
 * Checkout the proposal for more details on Bundlers.
 */
export class Bundler implements IBundler {
  private bundlerConfig: BundlerConfigWithChainId;

  // eslint-disable-next-line no-unused-vars
  UserOpReceiptIntervals!: { [key in number]?: number };

  UserOpWaitForTxHashIntervals!: { [key in number]?: number };

  UserOpReceiptMaxDurationIntervals!: { [key in number]?: number };

  UserOpWaitForTxHashMaxDurationIntervals!: { [key in number]?: number };

  private provider: PublicClient;

  constructor(bundlerConfig: Bundlerconfig) {
    const parsedChainId: number = bundlerConfig?.chainId || extractChainIdFromBundlerUrl(bundlerConfig.bundlerUrl);
    this.bundlerConfig = { ...bundlerConfig, chainId: parsedChainId };

    this.provider = createPublicClient({
      chain: bundlerConfig.viemChain ?? getChain(parsedChainId),
      transport: http((bundlerConfig.viemChain || getChain(parsedChainId)).rpcUrls.default.http[0]),
    });

    this.UserOpReceiptIntervals = {
      ...UserOpReceiptIntervals,
      ...bundlerConfig.userOpReceiptIntervals,
    };

    this.UserOpWaitForTxHashIntervals = {
      ...UserOpWaitForTxHashIntervals,
      ...bundlerConfig.userOpWaitForTxHashIntervals,
    };

    this.UserOpReceiptMaxDurationIntervals = {
      ...UserOpReceiptMaxDurationIntervals,
      ...bundlerConfig.userOpReceiptMaxDurationIntervals,
    };

    this.UserOpWaitForTxHashMaxDurationIntervals = {
      ...UserOpWaitForTxHashMaxDurationIntervals,
      ...bundlerConfig.userOpWaitForTxHashMaxDurationIntervals,
    };

    this.bundlerConfig.entryPointAddress = bundlerConfig.entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS;
  }

  public getBundlerUrl(): string {
    return `${this.bundlerConfig.bundlerUrl}`;
  }

  /**
   * @param userOpHash
   * @description This function will fetch gasPrices from bundler
   * @returns Promise<UserOpGasPricesResponse>
   */
  async estimateUserOpGas(userOp: UserOperationStruct, stateOverrideSet?: StateOverrideSet): Promise<UserOpGasResponse> {
    // expected dummySig and possibly dummmy paymasterAndData should be provided by the caller
    // bundler doesn't know account and paymaster implementation
    userOp = transformUserOP(userOp);

    const bundlerUrl = this.getBundlerUrl();

    const response: EstimateUserOpGasResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_estimateUserOperationGas",
          params: stateOverrideSet
            ? [userOp, this.bundlerConfig.entryPointAddress, stateOverrideSet]
            : [userOp, this.bundlerConfig.entryPointAddress],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      },
      "Bundler",
    );

    const userOpGasResponse = response.result;
    for (const key in userOpGasResponse) {
      if (key === "maxFeePerGas" || key === "maxPriorityFeePerGas") continue;
      if (userOpGasResponse[key as keyof UserOpGasResponse] === undefined || userOpGasResponse[key as keyof UserOpGasResponse] === null) {
        throw new Error(`Got undefined ${key} from bundler`);
      }
    }
    return userOpGasResponse;
  }

  /**
   *
   * @param userOp
   * @description This function will send signed userOp to bundler to get mined on chain
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: UserOperationStruct, simulationParam?: SimulationType): Promise<UserOpResponse> {
    const chainId = this.bundlerConfig.chainId;
    // transformUserOP will convert all bigNumber values to string
    userOp = transformUserOP(userOp);
    const simType = {
      simulation_type: simulationParam || "validation",
    };
    const params = [userOp, this.bundlerConfig.entryPointAddress, simType];
    const bundlerUrl = this.getBundlerUrl();
    const sendUserOperationResponse: SendUserOpResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_sendUserOperation",
          params: params,
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      },
      "Bundler",
    );
    const response: UserOpResponse = {
      userOpHash: sendUserOperationResponse.result,
      wait: (confirmations?: number): Promise<UserOpReceipt> => {
        // Note: maxDuration can be defined per chainId
        const maxDuration = this.UserOpReceiptMaxDurationIntervals[chainId] || 30000; // default 30 seconds
        let totalDuration = 0;

        return new Promise<UserOpReceipt>((resolve, reject) => {
          const intervalValue = this.UserOpReceiptIntervals[chainId] || 5000; // default 5 seconds
          const intervalId = setInterval(async () => {
            try {
              const userOpResponse = await this.getUserOpReceipt(sendUserOperationResponse.result);
              if (userOpResponse && userOpResponse.receipt && userOpResponse.receipt.blockNumber) {
                if (confirmations) {
                  const latestBlock = await this.provider.getBlockNumber();
                  const confirmedBlocks = Number(latestBlock) - userOpResponse.receipt.blockNumber;
                  if (confirmations >= confirmedBlocks) {
                    clearInterval(intervalId);
                    resolve(userOpResponse);
                    return;
                  }
                } else {
                  clearInterval(intervalId);
                  resolve(userOpResponse);
                  return;
                }
              }
            } catch (error) {
              clearInterval(intervalId);
              reject(error);
              return;
            }

            totalDuration += intervalValue;
            if (totalDuration >= maxDuration) {
              clearInterval(intervalId);
              reject(
                new Error(
                  `Exceeded maximum duration (${maxDuration / 1000} sec) waiting to get receipt for userOpHash ${
                    sendUserOperationResponse.result
                  }. Try getting the receipt manually using eth_getUserOperationReceipt rpc method on bundler`,
                ),
              );
            }
          }, intervalValue);
        });
      },
      waitForTxHash: (): Promise<UserOpStatus> => {
        const maxDuration = this.UserOpWaitForTxHashMaxDurationIntervals[chainId] || 20000; // default 20 seconds
        let totalDuration = 0;

        return new Promise<UserOpStatus>((resolve, reject) => {
          const intervalValue = this.UserOpWaitForTxHashIntervals[chainId] || 500; // default 0.5 seconds
          const intervalId = setInterval(async () => {
            try {
              const userOpStatus = await this.getUserOpStatus(sendUserOperationResponse.result);
              if (userOpStatus && userOpStatus.state && userOpStatus.transactionHash) {
                clearInterval(intervalId);
                resolve(userOpStatus);
                return;
              }
            } catch (error) {
              clearInterval(intervalId);
              reject(error);
              return;
            }

            totalDuration += intervalValue;
            if (totalDuration >= maxDuration) {
              clearInterval(intervalId);
              reject(
                new Error(
                  `Exceeded maximum duration (${maxDuration / 1000} sec) waiting to get receipt for userOpHash ${
                    sendUserOperationResponse.result
                  }. Try getting the receipt manually using eth_getUserOperationReceipt rpc method on bundler`,
                ),
              );
            }
          }, intervalValue);
        });
      },
    };
    return response;
  }

  /**
   *
   * @param userOpHash
   * @description This function will return userOpReceipt for a given userOpHash
   * @returns Promise<UserOpReceipt>
   */
  async getUserOpReceipt(userOpHash: string): Promise<UserOpReceipt> {
    const bundlerUrl = this.getBundlerUrl();
    const response: GetUserOperationReceiptResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_getUserOperationReceipt",
          params: [userOpHash],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      },
      "Bundler",
    );
    const userOpReceipt: UserOpReceipt = response.result;
    return userOpReceipt;
  }

  /**
   *
   * @param userOpHash
   * @description This function will return userOpReceipt for a given userOpHash
   * @returns Promise<UserOpReceipt>
   */
  async getUserOpStatus(userOpHash: string): Promise<UserOpStatus> {
    const bundlerUrl = this.getBundlerUrl();
    const response: GetUserOperationStatusResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "biconomy_getUserOperationStatus",
          params: [userOpHash],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      },
      "Bundler",
    );
    const userOpStatus: UserOpStatus = response.result;
    return userOpStatus;
  }

  /**
   *
   * @param userOpHash
   * @description this function will return UserOpByHashResponse for given UserOpHash
   * @returns Promise<UserOpByHashResponse>
   */
  async getUserOpByHash(userOpHash: string): Promise<UserOpByHashResponse> {
    const bundlerUrl = this.getBundlerUrl();
    const response: GetUserOpByHashResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "eth_getUserOperationByHash",
          params: [userOpHash],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      },
      "Bundler",
    );
    const userOpByHashResponse: UserOpByHashResponse = response.result;
    return userOpByHashResponse;
  }

  /**
   * @description This function will return the gas fee values
   */
  async getGasFeeValues(): Promise<GasFeeValues> {
    const bundlerUrl = this.getBundlerUrl();
    const response: GetGasFeeValuesResponse = await sendRequest(
      {
        url: bundlerUrl,
        method: HttpMethod.Post,
        body: {
          method: "biconomy_getGasFeeValues",
          params: [],
          id: getTimestampInSeconds(),
          jsonrpc: "2.0",
        },
      },
      "Bundler",
    );
    return response.result;
  }

  public static async create(config: Bundlerconfig): Promise<Bundler> {
    return new Bundler(config);
  }
}
