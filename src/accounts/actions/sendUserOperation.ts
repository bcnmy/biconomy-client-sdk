import type { Chain, Client, Hash, Transport } from "viem"
import type { PartialBy, Prettify } from "viem/chains"
import { parseAccount } from "../utils/helpers"
import type {
  GetAccountParameter,
  Middleware,
  SmartAccount,
  UserOperationStruct
} from "../utils/types"
import {sendUserOperation as sendUserOperationWithBundler} from "../../bundler/actions/sendUserOperation"

export type SendUserOperationParameters = {
  userOperation: PartialBy<
    UserOperationStruct,
    | "sender"
    | "nonce"
    | "initCode"
    | "callGasLimit"
    | "verificationGasLimit"
    | "preVerificationGas"
    | "maxFeePerGas"
    | "maxPriorityFeePerGas"
    | "paymasterAndData"
    | "signature"
  >
} & GetAccountParameter &
  Middleware

export async function sendUserOperation(
  client: Client,
  args: Prettify<SendUserOperationParameters>
): Promise<Hash> {
  const { account: account_ = client.account, userOperation } = args
  if (!account_) throw new Error("No account found.")

  const account = parseAccount(account_) as SmartAccount

  userOperation.signature = await account.signUserOperation(
    userOperation as UserOperationStruct
  )

  return sendUserOperationWithBundler(client, {
    account,
    userOperation: userOperation as UserOperationStruct
  })
}
