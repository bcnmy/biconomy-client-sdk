// import {
//   type Account,
//   type Chain,
//   type Client,
//   type PublicClientConfig,
//   type Transport,
//   createClient
// } from "viem"

// import {
//   type PaymasterClientActions,
//   paymasterActions
// } from "../client/decorators/paymaster.js"

// export type PaymasterClient<
//   TChain extends Chain | undefined = Chain | undefined
// > = Client<
//   Transport,
//   TChain,
//   Account | undefined,
//   PaymasterRpcSchema,
//   PaymasterClientActions
// >

// /**
//  * Creates a Paymaster Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
//  *
//  * A Paymaster Client is an interface to "paymaster endpoints" [JSON-RPC API](https://docs..io/reference/verifying-paymaster/endpoints) methods such as sponsoring user operation, etc through Paymaster Actions.
//  *
//  * @param config - {@link PublicClientConfig}
//  * @returns A  Paymaster Client. {@link PaymasterClient}
//  *
//  * @example
//  * import { createPublicClient, http } from 'viem'
//  * import { polygonMumbai } from 'viem/chains'
//  *
//  * const PaymasterClient = createPaymasterClient({
//  *   chain: polygonMumbai,
//  *   transport: http("https://paymaster.biconomy.io/api/v1/80001/YOUR_API_KEY_HERE"),
//  * })
//  */
// export const createPaymasterClient = <
//   transport extends Transport = Transport,
//   chain extends Chain | undefined = undefined
// >(
//   parameters: PublicClientConfig<transport, chain>
// ): PaymasterClient => {
//   const { key = "public", name = "Paymaster Client" } = parameters
//   const client = createClient({
//     ...parameters,
//     key,
//     name,
//     type: "PaymasterClient"
//   })
//   return client.extend(paymasterActions())
// }
