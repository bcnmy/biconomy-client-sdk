import {
  type Chain,
  type Client,
  ContractFunctionExecutionError,
  type Transport,
  decodeFunctionResult,
  encodeFunctionData
} from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { call, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

/**
 * Retrieves the account ID for a given smart account.
 *
 * @param client - The client instance.
 * @param args - Optional parameters for getting the smart account.
 * @returns The account ID as a string.
 * @throws {AccountNotFoundError} If the account is not found.
 * @throws {Error} If the accountId result is empty.
 *
 * @example
 * import { accountId } from '@biconomy/sdk'
 *
 * const id = await accountId(nexusClient)
 * console.log(id) // 'example_account_id'
 */
export async function accountId<TSmartAccount extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  args?: GetSmartAccountParameter<TSmartAccount>
): Promise<string> {
  let account_ = client.account

  if (args) {
    account_ = args.account as TSmartAccount
  }

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = account_ as SmartAccount

  const publicClient = account.client

  const abi = [
    {
      name: "accountId",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [
        {
          type: "string",
          name: "accountImplementationId"
        }
      ]
    }
  ] as const

  try {
    return await getAction(
      publicClient,
      readContract,
      "readContract"
    )({
      abi,
      functionName: "accountId",
      address: await account.getAddress()
    })
  } catch (error) {
    if (error instanceof ContractFunctionExecutionError) {
      const { factory, factoryData } = await account.getFactoryArgs()

      const result = await getAction(
        publicClient,
        call,
        "call"
      )({
        factory: factory,
        factoryData: factoryData,
        to: account.address,
        data: encodeFunctionData({
          abi,
          functionName: "accountId"
        })
      })

      if (!result || !result.data) {
        throw new Error("accountId result is empty")
      }

      return decodeFunctionResult({
        abi,
        functionName: "accountId",
        data: result.data
      })
    }

    throw error
  }
}
