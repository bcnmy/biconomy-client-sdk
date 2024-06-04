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
import type { Middleware, SendTransactionsWithPaymasterParameters, SmartAccount, Transaction } from "../utils/types"
import { sendUserOperation } from "./sendUserOperation"

/**
 * Creates, signs, and sends a new transaction to the network.
 * This function also allows you to sponsor this transaction if sender is a smartAccount
 *
 * - Docs: https://viem.sh/docs/actions/wallet/sendTransaction.html
 * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/transactions/sending-transactions
 * - JSON-RPC Methods:
 *   - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
 *   - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)
 *
 * @param client - Client to use
 * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash.
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { sendTransaction } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const hash = await sendTransaction(client, {
 *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * @example
 * // Account Hoisting
 * import { createWalletClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { mainnet } from 'viem/chains'
 * import { sendTransaction } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   account: privateKeyToAccount('0x…'),
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const hash = await sendTransaction(client, {
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 */
export async function sendTransactions(
  client: Client,
  args: Prettify<
    SendTransactionsWithPaymasterParameters
  >
): Promise<Hash> {
  const {
    account: account_ = client.account,
   transactions,
    middleware
  } = args

  if (!account_) {
    throw new Error("No account found.")
  }

  const account = parseAccount(account_) as SmartAccount

  if (account.type !== "local") {
    throw new Error("RPC account type not supported")
  }

  const callData = await account.encodeCallData(transactions)

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
