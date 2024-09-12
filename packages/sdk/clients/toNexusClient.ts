import {
  http,
  type Account,
  type Address,
  type Chain,
  type Client,
  type ClientConfig,
  type EstimateFeesPerGasReturnType,
  type Prettify,
  type PublicClient,
  type RpcSchema,
  type Transport
} from "viem"
import {
  type BundlerActions,
  type BundlerClientConfig,
  type PaymasterActions,
  type SmartAccount,
  type UserOperationRequest,
  createBundlerClient
} from "viem/account-abstraction"
import contracts from "../__contracts"
import type { Call } from "../account"

import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import type { BaseValidationModule } from "../modules/base/BaseValidationModule"
import { type Erc7579Actions, erc7579Actions } from "./decorators/erc7579"
import {
  type SmartAccountActions,
  smartAccountActions
} from "./decorators/smartAccount"

export type SendTransactionParameters = {
  calls: Call | Call[]
}

export type NexusClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends NexusAccount | undefined = NexusAccount | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account, rpcSchema>,
    "cacheTime" | "chain" | "key" | "name" | "pollingInterval" | "rpcSchema"
  > &
    BundlerActions<NexusAccount> &
    Erc7579Actions<NexusAccount> &
    SmartAccountActions<chain, NexusAccount> & {
      account: NexusAccount
      client?: client | Client | undefined
      bundlerTransport?: BundlerClientConfig["transport"]
      paymaster?: BundlerClientConfig["paymaster"] | undefined
      paymasterContext?: BundlerClientConfig["paymasterContext"] | undefined
      userOperation?: BundlerClientConfig["userOperation"] | undefined
    }
>

export type NexusClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account, rpcSchema>,
    | "account"
    | "cacheTime"
    | "chain"
    | "key"
    | "name"
    | "pollingInterval"
    | "rpcSchema"
  > & {
    /** RPC URL. */
    transport: transport
    /** Bundler URL. */
    bundlerTransport: transport
    /** Client that points to an Execution RPC URL. */
    client?: client | Client | undefined
    /** Paymaster configuration. */
    paymaster?:
      | true
      | {
          /** Retrieves paymaster-related User Operation properties to be used for sending the User Operation. */
          getPaymasterData?: PaymasterActions["getPaymasterData"] | undefined
          /** Retrieves paymaster-related User Operation properties to be used for gas estimation. */
          getPaymasterStubData?:
            | PaymasterActions["getPaymasterStubData"]
            | undefined
        }
      | undefined
    /** Paymaster context to pass to `getPaymasterData` and `getPaymasterStubData` calls. */
    paymasterContext?: unknown
    /** User Operation configuration. */
    userOperation?:
      | {
          /** Prepares fee properties for the User Operation request. */
          estimateFeesPerGas?:
            | ((parameters: {
                account: account | SmartAccount
                bundlerClient: Client
                userOperation: UserOperationRequest
              }) => Promise<EstimateFeesPerGasReturnType<"eip1559">>)
            | undefined
        }
      | undefined
    /** Owner of the account. */
    owner: Address | Account
    /** Index of the account. */
    index?: bigint
    /** Active module of the account. */
    activeModule?: BaseValidationModule
    /** Factory address of the account. */
    factoryAddress?: Address
    /** Owner module */
    k1ValidatorAddress?: Address
  }
>

export async function toNexusClient(
  parameters: NexusClientConfig
): Promise<NexusClient> {
  const {
    client: client_,
    chain = parameters.chain ?? client_?.chain,
    owner,
    index = 0n,
    key = "biconomy",
    name = "Bicononomy Client",
    activeModule,
    factoryAddress = contracts.k1ValidatorFactory.address,
    k1ValidatorAddress = contracts.k1Validator.address,
    bundlerTransport,
    paymaster,
    transport,
    paymasterContext,
    userOperation = {
      estimateFeesPerGas: async (parameters) => {
        const feeData = await (
          parameters?.account?.client as PublicClient
        )?.estimateFeesPerGas?.()
        return {
          maxFeePerGas: feeData.maxFeePerGas * 2n,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 2n
        }
      }
    }
  } = parameters

  if (!chain) throw new Error("Missing chain")

  const account = await toNexusAccount({
    ...parameters,
    transport,
    chain,
    owner,
    index,
    activeModule,
    factoryAddress,
    k1ValidatorAddress
  })

  const bundler = createBundlerClient({
    ...parameters,
    key,
    name,
    account: account as Account,
    paymaster,
    paymasterContext,
    transport:
      bundlerTransport ??
      http(
        `https://bundler.biconomy.io/api/v2/${chain.id}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`
      ),
    userOperation
  })
    .extend(erc7579Actions())
    .extend(smartAccountActions())

  return bundler as unknown as NexusClient
}
