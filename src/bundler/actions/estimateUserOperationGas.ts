import type { Account, Chain, Client, Hex, Transport } from "viem"
import type { BaseError } from "viem"
import type { Prettify } from "viem/chains"
import { ENTRYPOINT_ADDRESS_V07 } from "../../accounts/utils/constants"
import { getEstimateUserOperationGasError } from "../../errors/getters"
import {
  type BundlerRpcSchema,
  type StateOverrides,
  deepHexlify
} from "../utils/types"
import type { EstimateUserOperationGasParameters } from "./../../client/utils/types"

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
  paymasterVerificationGasLimit: bigint
  paymasterPostOpGasLimit: bigint
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

    const responseV07 = response as {
      preVerificationGas: Hex
      verificationGasLimit: Hex
      callGasLimit: Hex
      paymasterVerificationGasLimit?: Hex
      paymasterPostOpGasLimit?: Hex
    }

    return {
      preVerificationGas: responseV07.preVerificationGas.toString() || "0",
      verificationGasLimit: responseV07.verificationGasLimit.toString() || "0",
      callGasLimit: responseV07.callGasLimit.toString() || "0",
      paymasterVerificationGasLimit: responseV07.paymasterVerificationGasLimit
        ? BigInt(responseV07.paymasterVerificationGasLimit)
        : undefined,
      paymasterPostOpGasLimit: responseV07.paymasterPostOpGasLimit
        ? BigInt(responseV07.paymasterPostOpGasLimit)
        : undefined
    } as {
      preVerificationGas: string
      verificationGasLimit: string
      callGasLimit: string
      paymasterVerificationGasLimit: bigint
      paymasterPostOpGasLimit: bigint
    }
  } catch (err) {
    throw await getEstimateUserOperationGasError(err as BaseError, args)
  }
}
