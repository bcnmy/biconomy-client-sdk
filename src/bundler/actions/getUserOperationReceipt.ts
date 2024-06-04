import type { Account, Chain, Client, Hash, Transport } from "viem"
import type { Prettify } from "viem/chains"
import type { BundlerRpcSchema, UserOpReceipt } from "../utils/types"

export type GetUserOperationReceiptParameters = {
  hash: Hash
}

/**
 * Returns the user operation receipt from userOpHash
 *
 * - Docs: https://docs.biconomy.io/ ... // TODO
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link GetUserOperationReceiptParameters} UserOpHash that was returned by {@link sendUserOperation}
 * @returns user operation receipt {@link GetUserOperationReceiptReturnType} if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationReceipt } from "@biconomy/sdk"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationReceipt(bundlerClient, {hash: userOpHash})
 *
 */
export const getUserOperationReceipt = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  { hash }: Prettify<GetUserOperationReceiptParameters>
): Promise<Prettify<UserOpReceipt> | null> => {
  const params: [Hash] = [hash]

  const response = await client.request({
    method: "eth_getUserOperationReceipt",
    params
  })

  if (!response) return null

  const userOperationReceipt: UserOpReceipt = {
    userOpHash: response.userOpHash,
    entryPoint: response.entryPoint,
    paymaster: response.paymaster ?? "0x",
    actualGasCost: response.actualGasCost,
    actualGasUsed: response.actualGasUsed,
    success: response.success ?? "false",
    reason: response.reason ?? "",
    logs: response.logs,
    receipt: response.receipt
  }

  return userOperationReceipt
}
