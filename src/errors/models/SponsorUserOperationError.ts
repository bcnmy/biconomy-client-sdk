// import { BaseError } from "viem"
// import type { SponsorUserOperationParameters } from "../../paymaster/utils/types"
// import { prettyPrint } from "../helpers"

// export type SponsorUserOperationErrorType = SponsorUserOperationError & {
//   name: "SponsorUserOperationError"
// }
// export class SponsorUserOperationError extends BaseError {
//   override cause: BaseError

//   override name = "SponsorUserOperationError"

//   constructor(
//     cause: BaseError,
//     {
//       userOperation,
//       docsPath
//     }: SponsorUserOperationParameters & {
//       docsPath?: string
//     }
//   ) {
//     const prettyArgs = prettyPrint({
//       sender: userOperation.sender,
//       nonce: userOperation.nonce,
//       initCode: userOperation.initCode,
//       callData: userOperation.callData,
//       callGasLimit: userOperation.callGasLimit,
//       verificationGasLimit: userOperation.verificationGasLimit,
//       preVerificationGas: userOperation.preVerificationGas,
//       maxFeePerGas: userOperation.maxFeePerGas,
//       maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
//       paymasterAndData: userOperation.paymasterAndData,
//       signature: userOperation.signature
//     })

//     super(cause.shortMessage, {
//       cause,
//       docsPath,
//       metaMessages: [
//         ...(cause.metaMessages ? [...cause.metaMessages, " "] : []),
//         "SponsorUserOperation Arguments:",
//         prettyArgs
//       ].filter(Boolean) as string[]
//     })
//     this.cause = cause
//   }
// }
