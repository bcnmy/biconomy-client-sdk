import { BaseError } from "viem"

export type UnknownNodeErrorType = UnknownNodeError & {
  name: "UnknownNodeError"
}
export class UnknownNodeError extends BaseError {
  override name = "UnknownNodeError"

  constructor({ cause }: { cause?: BaseError }) {
    super(`An error occurred while executing: ${cause?.shortMessage}`, {
      cause
    })
  }
}
