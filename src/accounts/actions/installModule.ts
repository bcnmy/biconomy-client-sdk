import {
  type Address,
  type CallExecutionErrorType,
  type Client,
  type ContractFunctionExecutionErrorType,
  type ContractFunctionRevertedErrorType,
  type Hex,
  type RpcRequestErrorType,
  decodeErrorResult,
  encodeFunctionData,
  toHex
} from "viem"

import { sendTransaction } from "viem/actions"
import type { Prettify } from "viem/chains"
import type { ModuleType } from "../../modules/types"
import NexusABI from "../utils/abis/smartAccount.json"
import { getAction, isNullOrUndefined } from "../utils/helpers"
import type { SmartAccount } from "../utils/types"

export type InstallModuleParams = {
  moduleType: ModuleType
  moduleAddress: Address
  account: SmartAccount
}

export const installModule = async (
  client: Client,
  args: Prettify<InstallModuleParams>
): Promise<Hex> => {
  const { moduleType, moduleAddress, account } = args

  if (
    isNullOrUndefined(account) &&
    (isNullOrUndefined(moduleType) || isNullOrUndefined(moduleAddress))
  ) {
    throw new Error("One of the params not provided.")
  }

  const accountOwner = account.getAccountOwner()
  const installModuleData = encodeFunctionData({
    abi: NexusABI,
    functionName: "installModule",
    args: [moduleType, moduleAddress, toHex(accountOwner.address)]
  })

  try {
    return await getAction(
      client,
      sendTransaction
    )({
      account: account,
      to: account.address,
      data: installModuleData,
      value: 0n,
      chain: client.chain
    })
  } catch (e) {
    const err = e as ContractFunctionExecutionErrorType

    if (err.cause.name === "ContractFunctionRevertedError") {
      const revertError = err.cause as ContractFunctionRevertedErrorType
      const errorName = revertError.data?.errorName ?? ""
      if (
        errorName === "SenderAddressResult" &&
        revertError.data?.args &&
        revertError.data?.args[0]
      ) {
        return revertError.data?.args[0] as Address
      }
    }

    if (err.cause.name === "CallExecutionError") {
      const callExecutionError = err.cause as CallExecutionErrorType
      if (callExecutionError.cause.name === "RpcRequestError") {
        const revertError = callExecutionError.cause as RpcRequestErrorType
        // biome-ignore lint/suspicious/noExplicitAny: fuse issues
        const data = (revertError as unknown as any).cause.data.split(" ")[1]

        const error = decodeErrorResult({
          abi: [
            {
              inputs: [
                {
                  internalType: "address",
                  name: "sender",
                  type: "address"
                }
              ],
              name: "SenderAddressResult",
              type: "error"
            }
          ],
          data
        })
        return error.args[0] as Address
      }
    }

    throw e
  }
}
