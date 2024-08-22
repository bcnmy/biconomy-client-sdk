import { type Hex, keccak256, toHex } from "viem"
import type {
  BiconomyImplementations,
  BiconomyImplementationsByVersion,
  EntryPointAddresses,
  EntryPointAddressesByVersion
} from "./Types.js"

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export const MAGIC_BYTES =
  "0x6492649264926492649264926492649264926492649264926492649264926492"

// will always be latest entrypoint address
export const DEFAULT_ENTRYPOINT_ADDRESS =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
export const ENTRYPOINT_ADDRESSES: EntryPointAddresses = {
  "0x27a4db290b89ae3373ce4313cbeae72112ae7da9": "V0_0_5",
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789": "V0_0_6",
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032": "V0_0_7"
}

// will always be latest factory address
export const DEFAULT_BICONOMY_FACTORY_ADDRESS =
  "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778" // K1ValidatorFactory
export const DEFAULT_FALLBACK_HANDLER_ADDRESS =
  "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1"

export const BICONOMY_TOKEN_PAYMASTER =
  "0x00000f7365cA6C59A2C93719ad53d567ed49c14C"

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS =
  "0x8EBDcA5ce92f9aBF1D1ab21de24068B2a2EaF808"
export const ENTRYPOINT_V07_ADDRESS =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementations = {
  "0x00006b7e42e01957da540dc6a8f7c30c4d816af5": "V1_0_0",
  "0x66Ae45ad5BE4be08a70AD99e9cF41e6d6884B06F": "V2_0_0"
}

export const ENTRYPOINT_ADDRESSES_BY_VERSION: EntryPointAddressesByVersion = {
  V0_0_5: "0x27a4db290b89ae3373ce4313cbeae72112ae7da9",
  V0_0_6: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
  V0_0_7: "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION: BiconomyImplementationsByVersion =
  Object.fromEntries(
    Object.entries(BICONOMY_IMPLEMENTATION_ADDRESSES).map(([k, v]) => [v, k])
  )

export const EIP1559_UNSUPPORTED_NETWORKS: Array<number> = [97, 56, 1442, 1101]

export const PROXY_CREATION_CODE =
  "0x603d3d8160223d3973600966Ae45ad5BE4be08a70AD99e9cF41e6d6884B06F5155f3363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3"

export const ADDRESS_RESOLVER_ADDRESS =
  "0x00000E81673606e07fC79CE5F1b3B26957844468"

export const DefaultGasLimit = {
  callGasLimit: 800000,
  verificationGasLimit: 1000000,
  preVerificationGas: 100000
}

export const ERROR_MESSAGES = {
  ACCOUNT_NOT_DEPLOYED: "Account has not yet been deployed",
  ACCOUNT_ALREADY_DEPLOYED: "Account already deployed",
  NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY:
    "Native token balance is not available during deploy",
  SPENDER_REQUIRED: "spender is required for ERC20 mode",
  NO_FEE_QUOTE:
    "FeeQuote was not provided, please call smartAccount.getTokenFees() to get feeQuote",
  FAILED_FEE_QUOTE_FETCH: "Failed to fetch fee quote",
  CHAIN_NOT_FOUND: "Chain not found",
  NO_RECIPIENT: "Recipient is required",
  NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT:
    "'Amount' is required for withdrawal of native token without using a paymaster",
  MISSING_RPC_URL:
    "rpcUrl is required for PrivateKeyAccount signer type, please provide it in the config",
  INVALID_SESSION_INDEXES:
    "Session indexes and transactions must be of the same length and correspond to each other",
  SIGNER_REQUIRED: "Signer is required for creating a smart account",
  UNKNOW_SESSION_ARGUMENTS:
    "You have not provided the necessary information to find and use a session"
}

export const NATIVE_TOKEN_ALIAS: Hex =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
export const ERC20_ABI = [
  "function transfer(address to, uint256 value) external returns (bool)",
  "function transferFrom(address from, address to, uint256 value) external returns (bool)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
]

// BASE SEPOLIA CONTRACTS
export const NEXUS_IMPLEMENTATION = "0x8EBDcA5ce92f9aBF1D1ab21de24068B2a2EaF808"
export const BOOTSTRAP = "0xBCe1Ff9bA78870FBd41DED89a5E618D86440fd94"
export const BOOTSTRAP_LIB = "0xdA76AA9A299a2C7cA40976817b6C7D57cb198613"
export const K1_VALIDATOR_FACTORY = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"
export const BICONOMY_META_FACTORY =
  "0x69c06775D109126e6Ff97B1f95CBd4eaDF7e71bD"
export const MOCK_REGISTRY = "0x5d79F6247683fE309219e7399c26A63A72361CF0" // to update

export const ENTRYPOINT_ADDRESS_V07 =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

// define mode and exec type enums
export const CALLTYPE_SINGLE = "0x00" // 1 byte
export const CALLTYPE_BATCH = "0x01" // 1 byte
export const EXECTYPE_DEFAULT = "0x00" // 1 byte
export const EXECTYPE_TRY = "0x01" // 1 byte
export const EXECTYPE_DELEGATE = "0xFF" // 1 byte
export const MODE_DEFAULT = "0x00000000" // 4 bytes
export const UNUSED = "0x00000000" // 4 bytes
export const MODE_PAYLOAD = "0x00000000000000000000000000000000000000000000" // 22 bytes

export const GENERIC_FALLBACK_SELECTOR = "0xcb5baf0f"

export const SENTINEL_ADDRESS = "0x0000000000000000000000000000000000000001"

export const MODE_VALIDATION = "0x00" as Hex
export const MODE_MODULE_ENABLE = "0x01" as Hex

export const MODULE_ENABLE_MODE_TYPE_HASH = keccak256(
  toHex("ModuleEnableMode(address module, bytes32 initDataHash)")
)
export const MOCK_MULTI_MODULE_ADDRESS =
  "0x9C992f91E7Cd4697B81E137007f446E826b8378b"
export const MODULE_TYPE_MULTI = 0

export const NEXUS_DOMAIN_NAME = "Nexus"
export const NEXUS_DOMAIN_VERSION = "1.0.0-beta"