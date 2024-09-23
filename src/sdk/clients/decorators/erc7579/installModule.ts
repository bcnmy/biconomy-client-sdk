import { type Chain, type Client, type Hex, type Transport, encodeFunctionData, getAddress } from "viem"
import {
  type GetSmartAccountParameter,
  type SmartAccount,
  sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { Module } from "."
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { parseModuleTypeId } from "./supportsModule"

export type InstallModuleParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  module: Module
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
}

/**
 * Installs a module on a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, module to install, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { installModule } from '@biconomy/sdk'
 *
 * const userOpHash = await installModule(nexusClient, {
 *   module: {
 *     type: 'executor',
 *     address: '0x...',
 *     context: '0x'
 *   }
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function installModule<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: InstallModuleParameters<TSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    module: { address, data, type }
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount

  return getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: [
      {
        to: account.address,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: [
            {
              name: "installModule",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                {
                  type: "uint256",
                  name: "moduleTypeId"
                },
                {
                  type: "address",
                  name: "module"
                },
                {
                  type: "bytes",
                  name: "initData"
                }
              ],
              outputs: []
            }
          ],
          functionName: "installModule",
          args: [parseModuleTypeId(type), getAddress(address), data ?? "0x"]
        })
      }
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })
}
