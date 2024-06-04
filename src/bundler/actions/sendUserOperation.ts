import type { Account, Chain, Client, Hash, Transport } from "viem"
import type { BaseError } from "viem"
import type { Prettify } from "viem/chains"
import type {
  SendUserOperationParameters,
  UserOperationStruct
} from "../../accounts"
import { ENTRYPOINT_ADDRESS_V07 } from "../../accounts/utils/constants"
import { getSendUserOperationError } from "../../errors/getters"
import { BundlerRpcSchema } from "../utils/types"

/**
 * Sends user operation to the bundler
 *
 * - Docs: https://docs.biconomy.io/ ... // TODO
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link SendUserOperationParameters}.
 * @returns UserOpHash that you can use to track user operation as {@link Hash}.
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "@biconomy/sdk" // TODO
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const userOpHash = sendUserOperation(bundlerClient, {
 *      userOperation: signedUserOperation,
 *      entryPoint: entryPoint
 * })
 *
 * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
 */
export const sendUserOperation = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  args: Prettify<SendUserOperationParameters>
): Promise<Hash> => {
  const { userOperation } = args
  try {
    const userOperationHash = await client.request({
      method: "eth_sendUserOperation",
      params: [userOperation as UserOperationStruct, ENTRYPOINT_ADDRESS_V07]
    })

    return userOperationHash
  } catch (err) {
    throw await getSendUserOperationError(err as BaseError, args)
  }
}
