import type { Chain, Client, Hash, Transport } from "viem"
import type { PartialBy, Prettify } from "viem/chains"
import { sendUserOperationWithBundler } from "../../bundler"
import { getAction, parseAccount } from "../utils/helpers"
import type {
  GetAccountParameter,
  Middleware,
  SmartAccount,
  UserOperationStruct
} from "../utils/types"
import { prepareUserOperationRequest } from "./prepareUserOperationRequest"

export type SendUserOperationParameters<
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
> = {
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
} & GetAccountParameter<TAccount> &
  Middleware

export async function sendUserOperation<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<TTransport, TChain, TAccount>,
  args: Prettify<SendUserOperationParameters>
): Promise<Hash> {
  const { account: account_ = client.account } = args
  if (!account_) throw new Error("No account found.")

  const account = parseAccount(account_) as SmartAccount

  const userOperation = await getAction(
    client,
    prepareUserOperationRequest<TTransport, TChain, TAccount>
  )(args)

  userOperation.signature = await account.signUserOperation(
    userOperation as UserOperationStruct
  )

  console.log(userOperation, "userOperation");

  return sendUserOperationWithBundler(client, {
    userOperation: userOperation as UserOperationStruct
  })
}
