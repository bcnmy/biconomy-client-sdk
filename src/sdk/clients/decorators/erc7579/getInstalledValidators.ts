import type { Chain, Client, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { readContract } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { SENTINEL_ADDRESS } from "../../../account/utils/Constants"

export type GetInstalledValidatorsParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  pageSize?: bigint
  cursor?: Hex
}

/**
 * Retrieves the installed validators for a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, page size, and cursor.
 * @returns A tuple containing an array of validator addresses and the next cursor.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { getInstalledValidators } from '@biconomy/sdk'
 *
 * const [validators, nextCursor] = await getInstalledValidators(nexusClient, {
 *   pageSize: 10n
 * })
 * console.log(validators, nextCursor) // ['0x...', '0x...'], '0x...'
 */
export async function getInstalledValidators<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetInstalledValidatorsParameters<TSmartAccount>
): Promise<readonly [readonly Hex[], Hex]> {
  const {
    account: account_ = client.account,
    pageSize = 100n,
    cursor = SENTINEL_ADDRESS
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
            internalType: "address",
            name: "cursor",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "size",
            type: "uint256"
          }
        ],
        name: "getValidatorsPaginated",
        outputs: [
          {
            internalType: "address[]",
            name: "array",
            type: "address[]"
          },
          {
            internalType: "address",
            name: "next",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: "getValidatorsPaginated",
    args: [cursor, pageSize]
  }) as Promise<readonly [readonly Hex[], Hex]>
}
