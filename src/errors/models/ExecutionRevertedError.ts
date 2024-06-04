import { BaseError } from "viem"

export type ExecutionRevertedErrorType = ExecutionRevertedError & {
  code: 3
  name: "ExecutionRevertedError"
}
export class ExecutionRevertedError extends BaseError {
  static code = 3
  static nodeMessage = /execution reverted/

  override name = "ExecutionRevertedError"

  constructor({
    cause,
    message
  }: { cause?: BaseError; message?: string } = {}) {
    const reason = message
      ?.replace("execution reverted: ", "")
      ?.replace("execution reverted", "")
    super(
      `Execution reverted ${
        reason ? `with reason: ${reason}` : "for an unknown reason"
      }.`,
      {
        cause
      }
    )
  }
}
