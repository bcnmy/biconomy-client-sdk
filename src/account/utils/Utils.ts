import {
  type Address,
  type Hash,
  type Hex,
  concat,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters
} from "viem"
import type { UserOperationStruct } from "../../account"
import { type SupportedSigner, convertSigner } from "../../account"
import { extractChainIdFromBundlerUrl } from "../../bundler"
import { extractChainIdFromPaymasterUrl } from "../../bundler"
import type { BiconomySmartAccountV2Config } from "./Types.js"

/**
 * pack the userOperation
 * @param op
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export function packUserOp(
  op: Partial<UserOperationStruct>,
  forSignature = true
): string {
  if (!op.initCode || !op.callData || !op.paymasterAndData)
    throw new Error("Missing userOp properties")
  if (forSignature) {
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"
      ),
      [
        op.sender as Hex,
        BigInt(op.nonce as Hex),
        keccak256(op.initCode as Hex),
        keccak256(op.callData as Hex),
        BigInt(op.callGasLimit as Hex),
        BigInt(op.verificationGasLimit as Hex),
        BigInt(op.preVerificationGas as Hex),
        BigInt(op.maxFeePerGas as Hex),
        BigInt(op.maxPriorityFeePerGas as Hex),
        keccak256(op.paymasterAndData as Hex)
      ]
    )
  }
  // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
  return encodeAbiParameters(
    parseAbiParameters(
      "address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"
    ),
    [
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
      op.signature as Hex
    ]
  )
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const isNullOrUndefined = (value: any): value is undefined => {
  return value === null || value === undefined
}

export const compareChainIds = async (
  signer: SupportedSigner,
  biconomySmartAccountConfig: BiconomySmartAccountV2Config,
  skipChainIdCalls: boolean
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
): Promise<Error | void> => {
  const signerResult = await convertSigner(
    signer,
    skipChainIdCalls,
    biconomySmartAccountConfig.rpcUrl
  )

  const chainIdFromBundler = biconomySmartAccountConfig.bundlerUrl
    ? extractChainIdFromBundlerUrl(biconomySmartAccountConfig.bundlerUrl)
    : biconomySmartAccountConfig.bundler
      ? extractChainIdFromBundlerUrl(
          biconomySmartAccountConfig.bundler.getBundlerUrl()
        )
      : undefined

  const chainIdFromPaymasterUrl = biconomySmartAccountConfig.paymasterUrl
    ? extractChainIdFromPaymasterUrl(biconomySmartAccountConfig.paymasterUrl)
    : undefined

  if (!isNullOrUndefined(signerResult.chainId)) {
    if (
      chainIdFromBundler !== undefined &&
      signerResult.chainId !== chainIdFromBundler
    ) {
      throw new Error(
        `Chain IDs from signer (${signerResult.chainId}) and bundler (${chainIdFromBundler}) do not match.`
      )
    }
    if (
      chainIdFromPaymasterUrl !== undefined &&
      signerResult.chainId !== chainIdFromPaymasterUrl
    ) {
      throw new Error(
        `Chain IDs from signer (${signerResult.chainId}) and paymaster (${chainIdFromPaymasterUrl}) do not match.`
      )
    }
  } else {
    if (
      chainIdFromBundler !== undefined &&
      chainIdFromPaymasterUrl !== undefined &&
      chainIdFromBundler !== chainIdFromPaymasterUrl
    ) {
      throw new Error(
        `Chain IDs from bundler (${chainIdFromBundler}) and paymaster (${chainIdFromPaymasterUrl}) do not match.`
      )
    }
  }
}

export const isValidRpcUrl = (url: string): boolean => {
  const regex = /^(https:\/\/|wss:\/\/).*/
  return regex.test(url)
}

export const addressEquals = (a?: string, b?: string): boolean =>
  !!a && !!b && a?.toLowerCase() === b.toLowerCase()

export type SignWith6492Params = {
  factoryAddress: Address
  factoryCalldata: Hex
  signature: Hash
}

export const wrapSignatureWith6492 = ({
  factoryAddress,
  factoryCalldata,
  signature
}: SignWith6492Params): Hash => {
  // wrap the signature as follows: https://eips.ethereum.org/EIPS/eip-6492
  // concat(
  //  abi.encode(
  //    (create2Factory, factoryCalldata, originalERC1271Signature),
  //    (address, bytes, bytes)),
  //    magicBytes
  // )
  return concat([
    encodeAbiParameters(parseAbiParameters("address, bytes, bytes"), [
      factoryAddress,
      factoryCalldata,
      signature
    ]),
    "0x6492649264926492649264926492649264926492649264926492649264926492"
  ])
}

export function percentage(partialValue: number, totalValue: number) {
  return (100 * partialValue) / totalValue;
} 

export function convertToFactor(percentage: number | undefined): number {
  // Check if the input is within the valid range
  if(percentage){
    if (percentage < 1 || percentage > 100) {
      throw new Error("The percentage value should be between 1 and 100.");
    }
  
    // Calculate the factor
    var factor = (percentage / 100) + 1;
  
    return factor;
  } else {
    return 1;
  }
}