import type {
  Abi,
  Address,
  Chain,
  Client,
  DeriveChain,
  EncodeDeployDataParameters,
  FormattedTransactionRequest,
  GetChainParameter,
  Hex,
  LocalAccount,
  Transport,
  UnionOmit
} from "viem"

import type { PartialBy } from "viem/chains"


export type BigNumberish = number | string | bigint
export type BytesLike = `0x${string}` | Uint8Array | string

export type UserOperationStruct = {
  /* the origin of the request */
  sender: Address
  /* nonce of the transaction, returned from the entry point for this Address */
  nonce: BigNumberish
  /* Factory address for creating the sender if it does not exist yet */
  factory?: Address
  /* Data for the factory to create the sender if it does not exist yet */
  factoryData?: Hex
  /* the callData passed to the target */
  callData: Hex
  /* Value used by inner account execution */
  callGasLimit: BigNumberish
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit: BigNumberish
  /* Gas overhead of this UserOperation */
  preVerificationGas: BigNumberish
  /* Maximum fee per gas (similar to EIP-1559 max_fee_per_gas) */
  maxFeePerGas: BigNumberish
  /* Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas) */
  maxPriorityFeePerGas: BigNumberish
  /* Address of paymaster sponsoring the transaction */
  paymaster?: Address
  /* Gas limit for paymaster verification */
  paymasterVerificationGasLimit?: BigNumberish
  /* Gas limit for paymaster post-operation */
  paymasterPostOpGasLimit?: BigNumberish
  /* Extra data to send to the paymaster */
  paymasterData?: Hex
  /* Data passed into the account along with the nonce during the verification step */
  signature: Hex
  /* Init code is not used in this structure */
  initCode?: never
  /* Paymaster and data is not used in this structure */
  paymasterAndData?: never
}

export type SmartAccountSigner<
  TSource extends string = "custom",
  TAddress extends Address = Address
> = Omit<LocalAccount<TSource, TAddress>, "signTransaction">

export type TChain = Chain | undefined

// export type ENTRYPOINT_ADDRESS_V07_TYPE =
//   "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export type ENTRYPOINT_ADDRESS_V07_TYPE =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

export type Transaction = {
  to: Address
  value?: bigint | 0n
  data?: Hex | "0x"
}

/**
 * Represents a smart account.
 *
 * @template entryPoint - The type of the entry point address.
 * @template Name - The type of the account name.
 * @template transport - The type of the transport.
 * @template chain - The type of the chain.
 * @template TAbi - The type of the ABI.
 */
export type SmartAccount = LocalAccount & {
  /**
   * The client associated with the smart account.
   */
  client: Client

  /**
   * The entry point address of the smart account.
   */
  entryPoint: ENTRYPOINT_ADDRESS_V07_TYPE

  /**
   * Retrieves the nonce of the smart account.
   *
   * @returns A promise that resolves to the nonce as a bigint.
   */
  getNonce: () => Promise<bigint>

  /**
   * Retrieves the initialization code of the smart account.
   *
   * @returns A promise that resolves to the initialization code as a Hex string.
   */
  getInitCode: () => Promise<Hex>

  getAccountOwner: () => Promise<LocalAccount>

  /**
   * Retrieves the factory address of the smart account.
   *
   * @returns A promise that resolves to the factory address as an Address, or undefined if not available.
   */
  getFactory: () => Promise<Address | undefined>

  /**
   * Retrieves the factory data of the smart account.
   *
   * @returns A promise that resolves to the factory data as a Hex string, or undefined if not available.
   */
  getFactoryData: () => Promise<Hex | undefined>

  /**
   * Encodes the call data for a transaction.
   *
   * @param args - The Transaction arguments.
   * @returns A promise that resolves to the encoded call data as a Hex string.
   */
  encodeCallData: (args: Transaction | Transaction[]) => Promise<Hex>

  /**
   * Retrieves the dummy signature for a user operation.
   *
   * @param userOperation - The user operation.
   * @returns A promise that resolves to the dummy signature as a Hex string.
   */
  getDummySignature(): Promise<Hex>

  /**
   * Encodes the deploy call data for a smart contract.
   *
   * @param parameters - The parameters for encoding the deploy call data.
   * @returns A promise that resolves to the encoded deploy call data as a Hex string.
   */
  encodeDeployCallData: ({
    abi,
    args,
    bytecode
  }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>

  /**
   * Signs a user operation.
   *
   * @param userOperation - The user operation to sign.
   * @returns A promise that resolves to the signed user operation as a Hex string.
   */
  signUserOperation: (userOperation: UserOperationStruct) => Promise<Hex>
}

export type Middleware = {
  middleware?:
    | ((args: {
        userOperation: UserOperationStruct
      }) => Promise<UserOperationStruct>)
    | {
        gasPrice?: () => Promise<{
          maxPriorityFeePerGas: bigint | string | undefined
          maxFeePerGas: bigint | string | undefined
        }>
        sponsorUserOperation?: (
          args: SponsorUserOperationParameters
        ) => Promise<
          Pick<
            UserOperationStruct,
            | "callGasLimit"
            | "verificationGasLimit"
            | "preVerificationGas"
            | "paymasterAndData"
          >
        >
        paymasterMode?: PaymasterMode
        feeQuote?: PaymasterFeeQuote
      }
}

export type GetAccountParameter = { account: SmartAccount }

export type PrepareUserOperationRequestParameters = {
  userOperation: PartialBy<
    UserOperationStruct,
    | "sender"
    | "nonce"
    | "initCode"
    | "callGasLimit"
    | "verificationGasLimit"
    | "preVerificationGas"
    | "maxFeePerGas"
    | "maxPriorityFeePerGas"
    | "paymasterAndData"
    | "signature"
  >
} & GetAccountParameter &
  Middleware

  export type BuildUserOperationV07 = {
    transaction: Transaction,
  } & GetAccountParameter &
    Middleware

export type GetUserOperationHashParams = {
  userOperation: UserOperationStruct
  chainId: number
}

export type SendTransactionParameters<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined,
  TChainOverride extends Chain | undefined = Chain | undefined,
  ///
  derivedChain extends Chain | undefined = DeriveChain<TChain, TChainOverride>
> = UnionOmit<FormattedTransactionRequest<derivedChain>, "from"> &
  GetAccountParameter &
  GetChainParameter<TChain, TChainOverride>

export type KnownError = {
  name: string
  regex: string
  description: string
  causes: string[]
  solutions: string[]
}

export type GetSenderAddressParams =
  {
    entryPoint: ENTRYPOINT_ADDRESS_V07_TYPE
    factory: Address
    factoryData: Hex
    initCode?: never
  }

export type InstallModuleParams = {
  smartAccountAddress: Address,
  moduleType: any,
  moduleAddress: Address,
  initData: any
}

export enum ExecutionMethod {
  Execute,
  ExecuteFromExecutor,
  ExecuteUserOp,
}

export type NexusModules = {
  validators: Address[],
  executors: Address[],
  hook: Address,
  fallbacks: Address[]
}

export enum PaymasterMode {
  ERC20 = "ERC20",
  SPONSORED = "SPONSORED"
}

export type SendTransactionWithPaymasterParameters =  {transaction: Transaction, account: SmartAccount} & Middleware

export type SendTransactionsWithPaymasterParameters = {transactions: Transaction[], account: SmartAccount} & Middleware
