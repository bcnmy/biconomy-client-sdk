import type { Address, Chain, ClientConfig, Hash, Hex, Transport } from "viem"
import type { Prettify } from "viem/chains"
import type { Middleware, SmartAccount } from "../../accounts/utils/types"
import type { TStatus } from "../../bundler"

export type SmartAccountClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined
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
    status: TStatus
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
