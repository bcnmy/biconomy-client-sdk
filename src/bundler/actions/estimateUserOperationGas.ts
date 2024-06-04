import type { Account, Chain, Client, Transport } from "viem"
import type { BaseError } from "viem"
import type { Prettify } from "viem/chains"
import { ENTRYPOINT_ADDRESS_V07 } from "../../accounts/utils/constants"
import { getEstimateUserOperationGasError } from "../../errors/getters"
import { deepHexlify } from "../../paymaster/utils/helpers"
import type {
  BundlerRpcSchema,
  EstimateUserOperationGasParameters,
  StateOverrides
} from "../utils/types"

export const estimateUserOperationGas = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  args: Prettify<EstimateUserOperationGasParameters>,
  stateOverrides?: StateOverrides
): Promise<{
  preVerificationGas: string
  verificationGasLimit: string
  callGasLimit: string
  maxPriorityFeePerGas: string
  maxFeePerGas: string
}> => {
  const { userOperation } = args

  const userOperationWithBigIntAsHex = deepHexlify(userOperation)
  const stateOverridesWithBigIntAsHex = deepHexlify(stateOverrides)

  try {
    const response = await client.request({
      method: "eth_estimateUserOperationGas",
      params: stateOverrides
        ? [
            userOperationWithBigIntAsHex,
            ENTRYPOINT_ADDRESS_V07,
            stateOverridesWithBigIntAsHex
          ]
        : [userOperationWithBigIntAsHex, ENTRYPOINT_ADDRESS_V07]
    })

    const responseV06 = response as {
      preVerificationGas: string
      verificationGasLimit: string
      callGasLimit: string
      maxPriorityFeePerGas: string
      maxFeePerGas: string
    }

    return {
      preVerificationGas: responseV06.preVerificationGas.toString() || "0",
      verificationGasLimit: responseV06.verificationGasLimit.toString() || "0",
      callGasLimit: responseV06.callGasLimit.toString() || "0",
      maxPriorityFeePerGas: responseV06.maxPriorityFeePerGas.toString() || "0",
      maxFeePerGas: responseV06.maxFeePerGas.toString() || "0"
    } as {
      preVerificationGas: string
      verificationGasLimit: string
      callGasLimit: string
      maxPriorityFeePerGas: string
      maxFeePerGas: string
    }
  } catch (err) {
    throw await getEstimateUserOperationGasError(err as BaseError, args)
  }
}
