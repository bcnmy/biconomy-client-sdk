import {
  type Address,
  BaseError,
  type CallExecutionErrorType,
  type Chain,
  type Client,
  type ContractFunctionExecutionErrorType,
  type ContractFunctionRevertedErrorType,
  type Hex,
  type RpcRequestErrorType,
  type Transport,
  concat,
  decodeErrorResult
} from "viem"

import { simulateContract } from "viem/actions"
import type { Prettify } from "viem/chains"
import { getAction, isNullOrUndefined } from "../utils/helpers"
import type { GetSenderAddressParams } from "../utils/types"

export class InvalidEntryPointError extends BaseError {
  override name = "InvalidEntryPointError"

  constructor({
    cause,
    entryPoint
  }: { cause?: BaseError; entryPoint?: Address } = {}) {
    super(
      `The entry point address (\`entryPoint\`${
        entryPoint ? ` = ${entryPoint}` : ""
      }) is not a valid entry point. getSenderAddress did not revert with a SenderAddressResult error.`,
      {
        cause
      }
    )
  }
}

/**
 * Returns the address of the account that will be deployed with the given init code.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/public-actions/getSenderAddress
 *
 * @param client {@link Client} that you created using viem's createPublicClient.
 * @param args {@link GetSenderAddressParams} initCode & entryPoint
 * @returns Sender's Address
 *
 * @example
 * import { createPublicClient } from "viem"
 * import { getSenderAddress } from "permissionless/actions"
 *
 * const publicClient = createPublicClient({
 *      chain: goerli,
 *      transport: http("https://goerli.infura.io/v3/your-infura-key")
 * })
 *
 * const senderAddress = await getSenderAddress(publicClient, {
 *      initCode,
 *      entryPoint
 * })
 *
 * // Return '0x7a88a206ba40b37a8c07a2b5688cf8b287318b63'
 */
export const getSenderAddress = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined
>(
  client: Client<TTransport, TChain>,
  args: Prettify<GetSenderAddressParams>
): Promise<Address> => {
  const { initCode, entryPoint, factory, factoryData } = args

  if (
    isNullOrUndefined(initCode) &&
    (isNullOrUndefined(factory) || isNullOrUndefined(factoryData))
  ) {
    throw new Error(
      "Either `initCode` or `factory` and `factoryData` must be provided"
    )
  }
  try {
    await getAction(
      client,
      simulateContract
    )({
      address: entryPoint,
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
        },
        {
          inputs: [
            {
              internalType: "bytes",
              name: "initCode",
              type: "bytes"
            }
          ],
          name: "getSenderAddress",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ],
      functionName: "getSenderAddress",
      args: [initCode || concat([factory as Hex, factoryData as Hex])]
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

  throw new InvalidEntryPointError({ entryPoint })
}
