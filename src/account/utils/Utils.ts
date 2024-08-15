import {
  type Address,
  type Hash,
  type Hex,
  concat,
  encodeAbiParameters,
  hexToBytes,
  keccak256,
  pad,
  parseAbiParameters,
  stringToBytes,
  toBytes,
  toHex
} from "viem"
import type { UserOperationStruct } from "../../account"
import {
  MOCK_MULTI_MODULE_ADDRESS,
  MODULE_ENABLE_MODE_TYPE_HASH,
  type ModuleType,
  type SupportedSigner,
  convertSigner
} from "../../account"
import { extractChainIdFromBundlerUrl } from "../../bundler"
import { extractChainIdFromPaymasterUrl } from "../../bundler"
import type { NexusSmartAccountConfig } from "./Types.js"

/**
 * pack the userOperation
 * @param op
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export function packUserOp(
  userOperation: Partial<UserOperationStruct>
): string {
  const hashedInitCode = keccak256(
    userOperation.factory && userOperation.factoryData
      ? concat([userOperation.factory, userOperation.factoryData])
      : "0x"
  )
  const hashedCallData = keccak256(userOperation.callData ?? "0x")
  const hashedPaymasterAndData = keccak256(
    userOperation.paymaster
      ? concat([
          userOperation.paymaster,
          pad(toHex(userOperation.paymasterVerificationGasLimit || BigInt(0)), {
            size: 16
          }),
          pad(toHex(userOperation.paymasterPostOpGasLimit || BigInt(0)), {
            size: 16
          }),
          userOperation.paymasterData || "0x"
        ])
      : "0x"
  )

  return encodeAbiParameters(
    [
      { type: "address" },
      { type: "uint256" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "uint256" },
      { type: "bytes32" },
      { type: "bytes32" }
    ],
    [
      userOperation.sender as Address,
      userOperation.nonce ?? 0n,
      hashedInitCode,
      hashedCallData,
      concat([
        pad(toHex(userOperation.verificationGasLimit ?? 0n), {
          size: 16
        }),
        pad(toHex(userOperation.callGasLimit ?? 0n), { size: 16 })
      ]),
      userOperation.preVerificationGas ?? 0n,
      concat([
        pad(toHex(userOperation.maxPriorityFeePerGas ?? 0n), {
          size: 16
        }),
        pad(toHex(userOperation.maxFeePerGas ?? 0n), { size: 16 })
      ]),
      hashedPaymasterAndData
    ]
  )
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const isNullOrUndefined = (value: any): value is undefined => {
  return value === null || value === undefined
}

export const compareChainIds = async (
  signer: SupportedSigner,
  biconomySmartAccountConfig: NexusSmartAccountConfig,
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
  const regex = /^(http:\/\/|wss:\/\/|https:\/\/).*/
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
  return (100 * partialValue) / totalValue
}

export function convertToFactor(percentage: number | undefined): number {
  // Check if the input is within the valid range
  if (percentage) {
    if (percentage < 1 || percentage > 100) {
      throw new Error("The percentage value should be between 1 and 100.")
    }

    // Calculate the factor
    const factor = percentage / 100 + 1

    return factor
  }
  return 1
}

export function makeInstallDataAndHash(
  accountOwner: Address,
  modules: { moduleType: ModuleType; config: Hex }[]
): [string, string] {
  const types = modules.map((module) => BigInt(module.moduleType))
  const initDatas = modules.map((module) =>
    toHex(concat([toBytes(module.moduleType), module.config]))
  )

  const multiInstallData = encodeAbiParameters(
    [{ type: "uint256[]" }, { type: "bytes[]" }],
    [types, initDatas]
  )

  const structHash = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "bytes32" }],
      [
        MODULE_ENABLE_MODE_TYPE_HASH,
        MOCK_MULTI_MODULE_ADDRESS,
        keccak256(multiInstallData)
      ]
    )
  )

  const hashToSign = _hashTypedData(
    structHash,
    "Nexus",
    "1.0.0-beta",
    accountOwner
  )

  return [multiInstallData, hashToSign]
}

export function _hashTypedData(
  structHash: Hex,
  name: string,
  version: string,
  verifyingContract: Address
): string {
  const DOMAIN_SEPARATOR = keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "address" }
      ],
      [
        keccak256(
          stringToBytes(
            "EIP712Domain(string name,string version,address verifyingContract)"
          )
        ),
        keccak256(stringToBytes(name)),
        keccak256(stringToBytes(version)),
        verifyingContract
      ]
    )
  )

  return keccak256(
    concat([
      stringToBytes("\x19\x01"),
      hexToBytes(DOMAIN_SEPARATOR),
      hexToBytes(structHash)
    ])
  )
}
