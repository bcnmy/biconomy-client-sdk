import type {
  Address,
  Chain,
  Client,
  ClientConfig,
  EstimateFeesPerGasReturnType,
  Prettify,
  PublicClient,
  RpcSchema,
  Transport
} from "viem"
import type {
  BundlerActions,
  BundlerClientConfig,
  PaymasterActions,
  SmartAccount,
  UserOperationRequest
} from "viem/account-abstraction"
import contracts from "../__contracts"
import type { Call } from "../account/utils/Types"

import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import type { UnknownSigner } from "../account/utils/toSigner"
import type { BaseExecutionModule } from "../modules/base/BaseExecutionModule"
import type { BaseValidationModule } from "../modules/base/BaseValidationModule"
import { createBicoBundlerClient } from "./createBicoBundlerClient"
import { type Erc7579Actions, erc7579Actions } from "./decorators/erc7579"
import {
  type SmartAccountActions,
  smartAccountActions
} from "./decorators/smartAccount"

/**
 * Parameters for sending a transaction
 */
export type SendTransactionParameters = {
  calls: Call | Call[]
}

/**
 * Nexus Client type
 */
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
    /**
     * The Nexus account associated with this client
     */
    account: NexusAccount
    /**
     * Optional client for additional functionality
     */
    client?: client | Client | undefined
    /**
     * Transport configuration for the bundler
     */
    bundlerTransport?: BundlerClientConfig["transport"]
    /**
     * Optional paymaster configuration
     */
    paymaster?: BundlerClientConfig["paymaster"] | undefined
    /**
     * Optional paymaster context
     */
    paymasterContext?: BundlerClientConfig["paymasterContext"] | undefined
    /**
     * Optional user operation configuration
     */
    userOperation?: BundlerClientConfig["userOperation"] | undefined
  }
>

/**
 * Configuration for creating a Nexus Client
 */
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
    signer: UnknownSigner
    /** Index of the account. */
    index?: bigint
    /** Active module of the account. */
    activeValidationModule?: BaseValidationModule
    /** Executor module of the account. */
    executorModule?: BaseExecutionModule
    /** Factory address of the account. */
    factoryAddress?: Address
    /** Owner module */
    k1ValidatorAddress?: Address
  }
>

/**
 * Creates a Nexus Client for interacting with the Nexus smart account system.
 *
 * @param parameters - {@link NexusClientConfig}
 * @returns Nexus Client. {@link NexusClient}
 *
 * @example
 * import { createNexusClient } from '@biconomy/sdk'
 * import { http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const nexusClient = await createNexusClient({
 *   chain: mainnet,
 *   transport: http('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'),
 *   bundlerTransport: http('https://api.biconomy.io'),
 *   signer: '0x...',
 * })
 */
export async function createNexusClient(
  parameters: NexusClientConfig
): Promise<NexusClient> {
  const {
    client: client_,
    chain = parameters.chain ?? client_?.chain,
    signer,
    index = 0n,
    key = "nexus client",
    name = "Nexus Client",
    activeValidationModule,
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

  const nexusAccount = await toNexusAccount({
    transport,
    chain,
    signer,
    index,
    activeValidationModule,
    factoryAddress,
    k1ValidatorAddress
  })

  const bundler = createBicoBundlerClient({
    ...parameters,
    key,
    name,
    account: nexusAccount,
    paymaster,
    paymasterContext,
    transport: bundlerTransport,
    userOperation
  })
    .extend(erc7579Actions())
    .extend(smartAccountActions())

  return bundler as unknown as NexusClient
}
