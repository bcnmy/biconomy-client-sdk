import {
  http,
  type Chain,
  type Client,
  type Transport,
  type WalletClientConfig,
  createClient,
  createPublicClient,
  createWalletClient
} from "viem"
import type { Prettify } from "viem/chains"

import { signerToNexus } from "../accounts/index.js"
import { walletClientToSmartAccountSigner } from "../accounts/utils/helpers.js"
import type { SmartAccount } from "../accounts/utils/types.js"
import type { BundlerRpcSchema } from "../bundler/utils/types.js"
import {
  type SmartAccountActions,
  smartAccountActions
} from "./decorators/smartAccount.js"
import type { SmartAccountClientConfig } from "./utils/types.js"

export type SmartAccountClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined
> = Prettify<
  Client<
    transport,
    chain,
    account,
    BundlerRpcSchema,
    SmartAccountActions<chain, account>
  >
>

/**
 * Creates a EIP-4337 compliant Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs:
 *
 * A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.
 *
 * @param parameters - {@link WalletClientConfig}
 * @returns A Bundler Client. {@link SmartAccountClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const smartAccountClient = createSmartAccountClient({
 *   chain: mainnet,
 *   transport: http(BUNDLER_URL),
 * })
 */

export async function createSmartAccountClient(
  parameters: SmartAccountClientConfig
): Promise<SmartAccountClient> {
  const {
    key = "Account",
    name = "Smart Account Client",
    bundlerTransport,
    chain,
    account
  } = parameters

  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const walletClient = createWalletClient({
    account: account ?? "0x",
    chain,
    transport: bundlerTransport
  })

  const nexusAccount = await signerToNexus(publicClient, {
    signer: walletClientToSmartAccountSigner(walletClient)
  })

  const client = createClient({
    ...parameters,
    account: nexusAccount,
    key,
    name,
    transport: bundlerTransport,
    type: "smartAccountClient"
  })

  return client.extend(
    smartAccountActions({ middleware: parameters.middleware })
  ) as SmartAccountClient
}
