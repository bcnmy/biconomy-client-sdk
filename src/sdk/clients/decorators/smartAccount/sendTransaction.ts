import type {
  Chain,
  Client,
  Hash,
  SendTransactionParameters,
  Transport
} from "viem"
import {
  type SendUserOperationParameters,
  type SmartAccount,
  sendUserOperation,
  waitForUserOperationReceipt
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

/**
 * Creates, signs, and sends a new transaction to the network using a smart account.
 * This function also allows you to sponsor this transaction if the sender is a smart account.
 *
 * @param client - The client instance.
 * @param args - Parameters for sending the transaction or user operation.
 * @returns The transaction hash as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { sendTransaction } from '@biconomy/sdk'
 *
 * const hash = await sendTransaction(nexusClient, {
 *   to: '0x...',
 *   value: parseEther('0.1'),
 *   data: '0x...'
 * })
 * console.log(hash) // '0x...'
 */
export async function sendTransaction<
  account extends SmartAccount | undefined,
  chain extends Chain | undefined,
  accountOverride extends SmartAccount | undefined = undefined,
  chainOverride extends Chain | undefined = Chain | undefined,
  calls extends readonly unknown[] = readonly unknown[]
>(
  client: Client<Transport, chain, account>,
  args:
    | SendTransactionParameters<chain, account, chainOverride>
    | SendUserOperationParameters<account, accountOverride, calls>,
  signature?: `0x${string}`
): Promise<Hash> {
  let userOpHash: Hash

  if ("to" in args) {
    const {
      account: account_ = client.account,
      data,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to,
      value,
      nonce
    } = args

    if (!account_) {
      throw new AccountNotFoundError({
        docsPath: "/docs/actions/wallet/sendTransaction"
      })
    }

    const account = parseAccount(account_) as SmartAccount

    if (!to) throw new Error("Missing to address")

    userOpHash = await getAction(
      client,
      sendUserOperation,
      "sendUserOperation"
    )({
      calls: [
        {
          to,
          value: value || BigInt(0),
          data: data || "0x"
        }
      ],
      account,
      maxFeePerGas,
      maxPriorityFeePerGas,
      signature,
      nonce: nonce ? BigInt(nonce) : undefined
    })
  } else {
    userOpHash = await getAction(
      client,
      sendUserOperation,
      "sendUserOperation"
    )({ ...args, signature } as SendUserOperationParameters<account, accountOverride>)
  }

  const userOperationReceipt = await getAction(
    client,
    waitForUserOperationReceipt,
    "waitForUserOperationReceipt"
  )({
    hash: userOpHash
  })

  return userOperationReceipt?.receipt.transactionHash
}
