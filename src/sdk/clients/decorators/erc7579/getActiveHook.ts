import type { Chain, Client, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { readContract } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

export type GetActiveHookParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount>

/**
 * Retrieves the active hook for a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters for getting the smart account.
 * @returns The address of the active hook as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { getActiveHook } from '@biconomy/sdk'
 *
 * const activeHook = await getActiveHook(nexusClient)
 * console.log(activeHook) // '0x...'
 */
export async function getActiveHook<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetActiveHookParameters<TSmartAccount>
): Promise<Hex> {
  const { account: account_ = client.account } = parameters

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
        inputs: [],
        name: "getActiveHook",
        outputs: [
          {
            internalType: "address",
            name: "hook",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: "getActiveHook"
  }) as Promise<Hex>
}
