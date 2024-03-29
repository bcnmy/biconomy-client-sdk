import { encodeAbiParameters, parseAbiParameters, keccak256, Hex, Chain } from "viem";
import type { UserOperationStruct } from "@alchemy/aa-core";
import { SupportedSigner, convertSigner } from "@biconomy/common";
import { extractChainIdFromBundlerUrl } from "@biconomy/bundler";
import { BiconomySmartAccountV2Config } from "./Types.js";
import { extractChainIdFromPaymasterUrl } from "@biconomy/bundler";
import * as chains from "viem/chains";
import { ERROR_MESSAGES } from "./Constants.js";

/**
 * pack the userOperation
 * @param op
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export function packUserOp(op: Partial<UserOperationStruct>, forSignature = true): string {
  if (!op.initCode || !op.callData || !op.paymasterAndData) throw new Error("Missing userOp properties");
  if (forSignature) {
    return encodeAbiParameters(parseAbiParameters("address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"), [
      op.sender as Hex,
      BigInt(op.nonce as Hex),
      keccak256(op.initCode as Hex),
      keccak256(op.callData as Hex),
      BigInt(op.callGasLimit as Hex),
      BigInt(op.verificationGasLimit as Hex),
      BigInt(op.preVerificationGas as Hex),
      BigInt(op.maxFeePerGas as Hex),
      BigInt(op.maxPriorityFeePerGas as Hex),
      keccak256(op.paymasterAndData as Hex),
    ]);
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return encodeAbiParameters(parseAbiParameters("address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"), [
      op.sender as Hex,
      BigInt(op.nonce as Hex),
      op.initCode as Hex,
      op.callData as Hex,
      BigInt(op.callGasLimit as Hex),
      BigInt(op.verificationGasLimit as Hex),
      BigInt(op.preVerificationGas as Hex),
      BigInt(op.maxFeePerGas as Hex),
      BigInt(op.maxPriorityFeePerGas as Hex),
      op.paymasterAndData as Hex,
      op.signature as Hex,
    ]);
  }
}

export const isNullOrUndefined = (value: any): value is undefined => {
  return value === null || value === undefined;
};

export const compareChainIds = async (
  signer: SupportedSigner,
  biconomySmartAccountConfig: BiconomySmartAccountV2Config,
  skipChainIdCalls: boolean,
): Promise<Error | void> => {
  const signerResult = await convertSigner(signer, skipChainIdCalls);

  const chainIdFromBundler = biconomySmartAccountConfig.bundlerUrl
    ? extractChainIdFromBundlerUrl(biconomySmartAccountConfig.bundlerUrl)
    : biconomySmartAccountConfig.bundler
      ? extractChainIdFromBundlerUrl(biconomySmartAccountConfig.bundler.getBundlerUrl())
      : undefined;

  const chainIdFromPaymasterUrl = biconomySmartAccountConfig.paymasterUrl
    ? extractChainIdFromPaymasterUrl(biconomySmartAccountConfig.paymasterUrl)
    : undefined;

  if (!isNullOrUndefined(signerResult.chainId)) {
    if (chainIdFromBundler !== undefined && signerResult.chainId !== chainIdFromBundler) {
      throw new Error(`Chain IDs from signer (${signerResult.chainId}) and bundler (${chainIdFromBundler}) do not match.`);
    }
    if (chainIdFromPaymasterUrl !== undefined && signerResult.chainId !== chainIdFromPaymasterUrl) {
      throw new Error(`Chain IDs from signer (${signerResult.chainId}) and paymaster (${chainIdFromPaymasterUrl}) do not match.`);
    }
  } else {
    if (chainIdFromBundler !== undefined && chainIdFromPaymasterUrl !== undefined && chainIdFromBundler !== chainIdFromPaymasterUrl) {
      throw new Error(`Chain IDs from bundler (${chainIdFromBundler}) and paymaster (${chainIdFromPaymasterUrl}) do not match.`);
    }
  }
};

export const isValidRpcUrl = (url: string): boolean => {
  const regex = /^(https:\/\/|wss:\/\/).*/;
  return regex.test(url);
};

export const addressEquals = (a?: string, b?: string): boolean => !!a && !!b && a?.toLowerCase() === b.toLowerCase();

/**
 * Utility method for converting a chainId to a {@link Chain} object
 *
 * @param chainId
 * @returns a {@link Chain} object for the given chainId
 * @throws if the chainId is not found
 */
export const getChain = (chainId: number): Chain => {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain;
    }
  }
  throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND);
};
