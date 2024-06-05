import type {
  Account,
  Address,
  Chain,
  ClientConfig,
  Hash,
  Hex,
  Transport
} from "viem"
import type { PartialBy, Prettify } from "viem/chains"
import type {
  ENTRYPOINT_ADDRESS_V07_TYPE,
  Middleware,
  UserOperationStruct
} from "../../accounts/utils/types"

export type SmartAccountClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account>,
    "cacheTime" | "chain" | "key" | "name" | "pollingInterval"
  > &
    Middleware & {
      account: account
      bundlerTransport: Transport
    }
>

export type EstimateUserOperationGasReturnType = {
  preVerificationGas: bigint
  verificationGasLimit: bigint
  callGasLimit: bigint
}

export type GetUserOperationReceiptReturnType = {
  userOpHash: Hash
  sender: Address
  nonce: bigint
  actualGasUsed: bigint
  actualGasCost: bigint
  success: boolean
  receipt: {
    transactionHash: Hex
    transactionIndex: bigint
    blockHash: Hash
    blockNumber: bigint
    from: Address
    to: Address | null
    cumulativeGasUsed: bigint
    status: "success" | "failure"
    gasUsed: bigint
    contractAddress: Address | null
    logsBloom: Hex
    effectiveGasPrice: bigint
  }
  logs: {
    data: Hex
    blockNumber: bigint
    blockHash: Hash
    transactionHash: Hash
    logIndex: bigint
    transactionIndex: bigint
    address: Address
    topics: Hex[]
  }[]
}

export type EstimateUserOperationGasParameters = {
  userOperation: PartialBy<
    UserOperationStruct,
    | "callGasLimit"
    | "preVerificationGas"
    | "verificationGasLimit"
    | "paymasterVerificationGasLimit"
    | "paymasterPostOpGasLimit"
  >
  entryPoint: ENTRYPOINT_ADDRESS_V07_TYPE
}
