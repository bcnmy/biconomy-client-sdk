import { BaseError } from "viem"
import type { SendUserOperationParameters } from "../../accounts/actions/sendUserOperation"
import type { KnownError } from "../../accounts/utils/types"
import { buildErrorStrings } from "../helpers"
import {
  ExecutionRevertedError,
  type ExecutionRevertedErrorType,
  UnknownNodeError,
  type UnknownNodeErrorType
} from "../models"

export const ERRORS_URL = "https://bcnmy.github.io/aa-errors/errors.json"
export const DOCS_URL = "https://docs.biconomy.io/troubleshooting/commonerrors"

export const getBundlerError = async (
  err: BaseError,
  args: SendUserOperationParameters
) => {
  let errors: KnownError[] = []
  let message = err.details || ""

  try {
    errors = (await (await fetch(ERRORS_URL)).json()) as KnownError[]
    message = (JSON.parse(err.details)?.message || "").toLowerCase()
  } catch (_) {}

  const executionRevertedError =
    err instanceof BaseError
      ? err.walk(
          (e) => (e as { code: number }).code === ExecutionRevertedError.code
        )
      : err

  if (executionRevertedError instanceof BaseError) {
    return new ExecutionRevertedError({
      cause: err,
      message: executionRevertedError.details
    }) as ExecutionRevertedErrorType
  }

  // TODO: Add validation Errors
  if (args.userOperation.sender === undefined)
    return new UnknownNodeError({ cause: err })
  if (args.userOperation.nonce === undefined)
    return new UnknownNodeError({ cause: err })

  const matchedError: KnownError | undefined = message
    ? errors.find(
        (error: KnownError) => message.toLowerCase().indexOf(error.regex) > -1
      )
    : undefined

  if (matchedError) {
    const title = `${matchedError.regex.toUpperCase()}: ${matchedError.name}`
    return new BaseError(title, {
      cause: err,
      metaMessages: buildErrorStrings(matchedError),
      docsSlug: DOCS_URL
    })
  }

  return new UnknownNodeError({ cause: err }) as UnknownNodeErrorType
}
