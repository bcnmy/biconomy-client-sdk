import type { Account, Chain, Client, Hash, Transport } from "viem"
import type { BundlerRpcSchema, UserOpStatus } from "../utils/types"

export const getUserOpStatus = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  userOpHash: Hash
): Promise<UserOpStatus> => {
  try {
    const response = await client.request({
      method: "biconomy_getUserOperationStatus",
      params: [userOpHash]
    })

    return {
      state: response.state,
      transactionHash: response.transactionHash,
      userOperationReceipt: response.userOperationReceipt
    } as UserOpStatus
  } catch (err) {
    throw new Error(`Error getting user op status. ${err}`)
  }
}
