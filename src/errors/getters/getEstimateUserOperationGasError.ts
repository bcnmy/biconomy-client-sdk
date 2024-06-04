import { type BaseError, UnknownNodeError } from "viem"
import type { EstimateUserOperationGasParameters } from "../../bundler/utils/types"
import { EstimateUserOperationGasError } from "../models"
import { getBundlerError } from "./getBundlerError"

export async function getEstimateUserOperationGasError(
  err: BaseError,
  args: EstimateUserOperationGasParameters
) {
  const getCause = async () => {
    const cause = getBundlerError(
      err as BaseError,
      args as EstimateUserOperationGasParameters
    )
    if (cause instanceof UnknownNodeError) return err as BaseError
    return cause
  }

  const causeResult = await getCause()

  throw new EstimateUserOperationGasError(causeResult, { ...args })
}
