import { type BaseError, UnknownNodeError } from "viem"
import type { SendUserOperationParameters } from "../../accounts/actions/sendUserOperation"
import { SendUserOperationError } from "../models"
import { getBundlerError } from "./getBundlerError"

export async function getSendUserOperationError(
  err: BaseError,
  args: SendUserOperationParameters
) {
  const getCause = async () => {
    const cause = getBundlerError(
      err as BaseError,
      args as SendUserOperationParameters
    )
    if (cause instanceof UnknownNodeError) return err as BaseError
    return cause
  }

  const causeResult = await getCause()

  throw new SendUserOperationError(causeResult, {
    ...args
  })
}
