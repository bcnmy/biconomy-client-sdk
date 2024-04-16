import { BaseError } from "viem"
import type { Service } from "../../account"

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

const knownErrors: KnownError[] = []

const matchError = (message: string): null | KnownError =>
  knownErrors.find(
    (knownError: KnownError) =>
      message.toLowerCase().indexOf(knownError.regex) > -1
  ) ?? null

const buildErrorStrings = (error: KnownError, service?: Service): string[] =>
  [
    `${error.description}\n`,
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

  constructor(title: string, params: AccountAbstractionErrorParams = {}) {
    super(title, params)
  }
}

export const getAAError = async (message: string, service?: Service) => {
  if (!knownErrors.length) {
    const errors = (await (await fetch(ERRORS_URL)).json()) as KnownError[]
    knownErrors.push(...errors)
  }

  const details: string =
    `${service} - ${typeof message}` === "string"
      ? message
      : JSON.stringify(message)
  const matchedError = matchError(details)
  const metaMessages = matchedError
    ? buildErrorStrings(matchedError, service)
    : []
  const title = matchedError ? matchedError.name : "Unknown Error"
  const docsSlug = matchedError?.docsUrl ?? DOCS_URL

  return new AccountAbstractionError(title, { docsSlug, metaMessages, details })
}
