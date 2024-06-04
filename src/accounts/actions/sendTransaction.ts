import type {
  Chain,
  Client,
  Hash,
  SendTransactionParameters,
  Transport
} from "viem"
import type { Prettify } from "viem/chains"
import { waitForUserOperationReceipt } from "../../bundler/actions/waitForUserOperationReceipt"
import type { UserOpReceipt } from "../../bundler/utils/types"
import { getAction, parseAccount } from "../utils/helpers"
import type { Middleware, SendTransactionWithPaymasterParameters, SmartAccount, Transaction } from "../utils/types"
import { sendUserOperation } from "./sendUserOperation"

export async function sendTransaction<
  TChain extends Chain | undefined,
  TAccount extends SmartAccount | undefined,
>(
  client: Client<Transport, TChain, TAccount>,
  args: Prettify<
    SendTransactionWithPaymasterParameters
  >
): Promise<Hash> {
  const {
    account: account_ = client.account,
    transaction,
    middleware
  } = args

  if (!account_) {
    throw new Error("No account found.")
  }

  const account = parseAccount(account_) as SmartAccount

  if (!transaction.to) throw new Error("Missing to address")

  if (account.type !== "local") {
    throw new Error("RPC account type not supported")
  }

  const callData = await account.encodeCallData(transaction)

  const userOpHash = await getAction(
    client,
    sendUserOperation
  )({
    userOperation: {
      sender: account.address,
      callData: callData,
    },
    account: account,
    middleware
  })

  const userOperationReceipt: UserOpReceipt = await getAction(
    client,
    waitForUserOperationReceipt
  )({
    hash: userOpHash
  })

  return userOperationReceipt?.receipt.transactionHash
}
