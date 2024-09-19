import type { Chain, Client, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { readContract } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { GENERIC_FALLBACK_SELECTOR } from "../../../account/utils/Constants"

export type GetFallbackBySelectorParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> &
  Partial<{
    selector?: Hex
  }>

export async function getFallbackBySelector<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetFallbackBySelectorParameters<TSmartAccount>
): Promise<[Hex, Hex]> {
  const {
    account: account_ = client.account,
    selector = GENERIC_FALLBACK_SELECTOR
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount

  const publicClient = account.client

  return getAction(
    publicClient,
    readContract,
    "readContract"
  )({
    address: account.address,
    abi: [
      {
        inputs: [
          {
            internalType: "bytes4",
            name: "selector",
            type: "bytes4"
          }
        ],
        name: "getFallbackHandlerBySelector",
        outputs: [
          {
            internalType: "CallType",
            name: "",
            type: "bytes1"
          },
          {
            internalType: "address",
            name: "",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: "getFallbackHandlerBySelector",
    args: [selector]
  }) as Promise<[Hex, Hex]>
}
