import type { Hex } from "viem"
import type {
  BiconomyFactories,
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
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"
export const ENTRYPOINT_ADDRESSES: EntryPointAddresses = {
  "0x27a4db290b89ae3373ce4313cbeae72112ae7da9": "V0_0_5",
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789": "V0_0_6"
}

// will always be latest factory address
export const TAIKO_FACTORY_ADDRESS = "0x000008B3078bA5ed444FFf7658F76385F6004e7A"; //https://biconomyworkspace.slack.com/archives/C061BSA9279/p1721234773541039
export const DEFAULT_BICONOMY_FACTORY_ADDRESS =
  "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5"
export const DEFAULT_FALLBACK_HANDLER_ADDRESS =
  "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1"
export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
  "0x000000f9ee1842bb72f6bbdd75e6d3d4e3e9594c": "V1_0_0",
  "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5": "V2_0_0"
}

export const BICONOMY_TOKEN_PAYMASTER =
  "0x00000f7365cA6C59A2C93719ad53d567ed49c14C"

// will always be latest implementation address
export const DEFAULT_BICONOMY_IMPLEMENTATION_ADDRESS =
  "0x0000002512019Dafb59528B82CB92D3c5D2423aC"
export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementations = {
  "0x00006b7e42e01957da540dc6a8f7c30c4d816af5": "V1_0_0",
  "0x0000002512019Dafb59528B82CB92D3c5D2423aC": "V2_0_0"
}

export const ENTRYPOINT_ADDRESSES_BY_VERSION: EntryPointAddressesByVersion = {
  V0_0_5: "0x27a4db290b89ae3373ce4313cbeae72112ae7da9",
  V0_0_6: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION: BiconomyImplementationsByVersion =
  Object.fromEntries(
    Object.entries(BICONOMY_IMPLEMENTATION_ADDRESSES).map(([k, v]) => [v, k])
  )

export const EIP1559_UNSUPPORTED_NETWORKS: Array<number> = [97, 56, 1442, 1101]

export const PROXY_CREATION_CODE =
  "0x6080346100aa57601f61012038819003918201601f19168301916001600160401b038311848410176100af578084926020946040528339810103126100aa57516001600160a01b0381168082036100aa5715610065573055604051605a90816100c68239f35b60405162461bcd60e51b815260206004820152601e60248201527f496e76616c696420696d706c656d656e746174696f6e206164647265737300006044820152606490fd5b600080fd5b634e487b7160e01b600052604160045260246000fdfe608060405230546000808092368280378136915af43d82803e156020573d90f35b3d90fdfea2646970667358221220a03b18dce0be0b4c9afe58a9eb85c35205e2cf087da098bbf1d23945bf89496064736f6c63430008110033"

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
    "You have not provided the necessary information to find and use a session",
  CHAIN_ID_MISMATCH: "Chain ID does not match the chain ID of the session",
  MISSING_SESSION_ID: "Session ID is missing",
  NO_LEAF_FOUND: "No leaf found for the provided session ID",
  NO_DAN_MODULE_INFO: "No DAN module info found for the provided session ID",
  INVALID_BROWSER_WALLET: "Invalid BrowserWallet provided"
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
