import {
  type Address,
  type Client,
  type Hash,
  type Hex,
  type PublicClient,
  type TypedData,
  type TypedDataDomain,
  type TypedDataParameter,
  concat,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  hexToBytes,
  keccak256,
  pad,
  parseAbi,
  parseAbiParameters,
  publicActions,
  stringToBytes,
  toBytes,
  toHex
} from "viem"
import { EIP1271Abi } from "../../__contracts/abi"
import {
  MOCK_MULTI_MODULE_ADDRESS,
  MODULE_ENABLE_MODE_TYPE_HASH,
  NEXUS_DOMAIN_NAME,
  NEXUS_DOMAIN_TYPEHASH,
  NEXUS_DOMAIN_VERSION
} from "../../account/utils/Constants"
import { type ModuleType, moduleTypeIds } from "../../modules/utils/Types"
import type {
  AccountMetadata,
  EIP712DomainReturn,
  UserOperationStruct
} from "./Types"

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
  modules: { type: ModuleType; config: Hex }[]
): [string, string] {
  const types = modules.map((module) => BigInt(moduleTypeIds[module.type]))
  const initDatas = modules.map((module) =>
    toHex(concat([toBytes(BigInt(moduleTypeIds[module.type])), module.config]))
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
        keccak256(stringToBytes(NEXUS_DOMAIN_TYPEHASH)),
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

export function getTypesForEIP712Domain({
  domain
}: { domain?: TypedDataDomain | undefined }): TypedDataParameter[] {
  return [
    typeof domain?.name === "string" && { name: "name", type: "string" },
    domain?.version && { name: "version", type: "string" },
    typeof domain?.chainId === "number" && {
      name: "chainId",
      type: "uint256"
    },
    domain?.verifyingContract && {
      name: "verifyingContract",
      type: "address"
    },
    domain?.salt && { name: "salt", type: "bytes32" }
  ].filter(Boolean) as TypedDataParameter[]
}
export const accountMetadata = async (
  client: Client,
  accountAddress: Address
): Promise<AccountMetadata> => {
  try {
    const domain = await client.request({
      method: "eth_call",
      params: [
        {
          to: accountAddress,
          data: encodeFunctionData({
            abi: EIP1271Abi,
            functionName: "eip712Domain"
          })
        },
        "latest"
      ]
    })

    if (domain !== "0x") {
      const decoded = decodeFunctionResult({
        abi: [...EIP1271Abi],
        functionName: "eip712Domain",
        data: domain
      })
      return {
        name: decoded?.[1],
        version: decoded?.[2],
        chainId: decoded?.[3]
      }
    }
  } catch (error) {}
  return {
    name: NEXUS_DOMAIN_NAME,
    version: NEXUS_DOMAIN_VERSION,
    chainId: client.chain
      ? BigInt(client.chain.id)
      : BigInt(await client.extend(publicActions).getChainId())
  }
}

export const eip712WrapHash = (typedHash: Hex, appDomainSeparator: Hex): Hex =>
  keccak256(concat(["0x1901", appDomainSeparator, typedHash]))

export type TypedDataWith712 = {
  EIP712Domain: TypedDataParameter[]
} & TypedData

export function typeToString(typeDef: TypedDataWith712): string[] {
  return Object.entries(typeDef).map(([key, fields]) => {
    const fieldStrings = (fields ?? [])
      .map((field) => `${field.type} ${field.name}`)
      .join(",")
    return `${key}(${fieldStrings})`
  })
}

/** @ignore */
export function bigIntReplacer(_key: string, value: any): any {
  return typeof value === "bigint" ? value.toString() : value
}

export const getAccountDomainStructFields = async (
  publicClient: PublicClient,
  accountAddress: Address
) => {
  const accountDomainStructFields = (await publicClient.readContract({
    address: accountAddress,
    abi: parseAbi([
      "function eip712Domain() public view returns (bytes1 fields, string memory name, string memory version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] memory extensions)"
    ]),
    functionName: "eip712Domain"
  })) as EIP712DomainReturn

  const [fields, name, version, chainId, verifyingContract, salt, extensions] =
    accountDomainStructFields

  const params = parseAbiParameters([
    "bytes1, bytes32, bytes32, uint256, address, bytes32, bytes32"
  ])

  return encodeAbiParameters(params, [
    fields,
    keccak256(toBytes(name)),
    keccak256(toBytes(version)),
    chainId,
    verifyingContract,
    salt,
    keccak256(encodePacked(["uint256[]"], [extensions]))
  ])
}
