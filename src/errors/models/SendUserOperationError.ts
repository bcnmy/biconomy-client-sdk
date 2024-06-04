import { BaseError } from "viem"
import type { SendUserOperationParameters } from "../../accounts/actions/sendUserOperation"
import { prettyPrint } from "../helpers"

export type SendUserOperationErrorType = SendUserOperationError & {
  name: "SendUserOperationError"
}
export class SendUserOperationError extends BaseError {
  override cause: BaseError

  override name = "SendUserOperationError"

  constructor(
    cause: BaseError,
    {
      userOperation,
      docsPath
    }: SendUserOperationParameters & {
      docsPath?: string
    }
  ) {
    const prettyArgs = prettyPrint({
      sender: userOperation.sender,
      nonce: userOperation.nonce,
      initCode: userOperation.initCode,
      callData: userOperation.callData,
      callGasLimit: userOperation.callGasLimit,
      verificationGasLimit: userOperation.verificationGasLimit,
      preVerificationGas: userOperation.preVerificationGas,
      maxFeePerGas: userOperation.maxFeePerGas,
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
      paymasterAndData: userOperation.paymasterAndData,
      signature: userOperation.signature
    })

    super(cause.shortMessage, {
      cause,
      docsPath,
      metaMessages: [
        ...(cause.metaMessages ? [...cause.metaMessages, " "] : []),
        "SendUserOperation Arguments:",
        prettyArgs
      ].filter(Boolean) as string[]
    })
    this.cause = cause
  }
}
