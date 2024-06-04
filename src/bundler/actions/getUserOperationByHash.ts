import type { Account, Address, Chain, Client, Hash, Transport } from "viem"
import type { Prettify } from "viem/chains"
import type { BundlerRpcSchema } from "../utils/types"

export type GetUserOperationByHashParameters = {
  hash: Hash
}

export type GetUserOperationByHashReturnType = {
  // userOperation: UserOperationStruct
  entryPoint: Address
  transactionHash: Hash
  blockHash: Hash
  blockNumber: bigint
}

/**
 * Returns the user operation from userOpHash
 *
 * - Docs: https://docs.biconomy.io/ ... // TODO
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link GetUserOperationByHashParameters} UserOpHash that was returned by {@link sendUserOperation}
 * @returns userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationByHash } from "@biconomy/sdk" // TODO
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationByHash(bundlerClient, {hash: userOpHash})
 *
 */
export const getUserOperationByHash = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  { hash }: Prettify<GetUserOperationByHashParameters>
): Promise<Prettify<GetUserOperationByHashReturnType> | null> => {
  const params: [Hash] = [hash]

  const response = await client.request({
    method: "eth_getUserOperationByHash",
    params
  })

  if (!response) return null

  // const userOperation = {
  //   sender: response.sender,
  //   nonce: response.nonce,
  //   initCode: response.initCode,
  //   callData: response.callData,
  //   callGasLimit: response.callGasLimit,
  //   verificationGasLimit: response.verificationGasLimit,
  //   preVerificationGas: response.preVerificationGas,
  //   maxFeePerGas: response.maxFeePerGas,
  //   maxPriorityFeePerGas: response.maxPriorityFeePerGas,
  //   paymasterAndData: response.paymasterAndData,
  //   signature: response.signature
  // }

  return {
    entryPoint: response.entryPoint,
    transactionHash: response.transactionHash,
    blockHash: response.blockHash,
    blockNumber: BigInt(response.blockNumber)
  }
}
