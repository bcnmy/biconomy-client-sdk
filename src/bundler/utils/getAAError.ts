import { BaseError } from "viem"
import type { Service } from "../../account"
import { SDK_VERSION } from "./Constants"
export type KnownError = {
  name: string
  regex: string
  description: string
  causes: string[]
  solutions: string[]
  docsUrl?: string
}

export const ERRORS_URL = "https://bcnmy.github.io/aa-errors/errors.json"
export const DOCS_URL = "https://docs.biconomy.io/troubleshooting/commonerrors"
const UNKOWN_ERROR_CODE = "520"

const knownErrors: KnownError[] = []

const matchError = (message: string): null | KnownError =>
  knownErrors.find(
    (knownError: KnownError) =>
      message.toLowerCase().indexOf(knownError.regex) > -1
  ) ?? null

const buildErrorStrings = (
  error: KnownError,
  status: string,
  service?: Service
): string[] =>
  [
    `${status}: ${error.description}\n`,
    error.causes?.length
      ? ["Potential cause(s): \n", ...error.causes, ""].join("\n")
      : "",
    error.solutions?.length
      ? ["Potential solution(s): \n", ...error.solutions].join("\n")
      : "",
    service ? `\nSent via: ${service}` : ""
  ].filter(Boolean)

type AccountAbstractionErrorParams = {
  docsSlug?: string
  metaMessages?: string[]
  details?: string
}

class AccountAbstractionError extends BaseError {
  override name = "AccountAbstractionError"
  override version = `@biconomy/account@${SDK_VERSION}`

  constructor(title: string, params: AccountAbstractionErrorParams = {}) {
    super(title, params)
  }
}

export const getAAError = async (
  message: string,
  httpStatus?: number,
  service?: Service
) => {
  if (!knownErrors.length) {
    const errors = (await (await fetch(ERRORS_URL)).json()) as KnownError[]
    knownErrors.push(...errors)
  }

  const details: string =
    `${service} - ${typeof message}` === "string"
      ? message
      : JSON.stringify(message)
  const matchedError = matchError(details)
  const status =
    matchedError?.regex ?? (httpStatus ?? UNKOWN_ERROR_CODE).toString()

  const metaMessages = matchedError
    ? buildErrorStrings(matchedError, status, service)
    : []
  const title = matchedError ? matchedError.name : "Unknown Error"
  const docsSlug = matchedError?.docsUrl ?? DOCS_URL

  return new AccountAbstractionError(title, {
    docsSlug,
    metaMessages,
    details
  })
}
