// import { type BaseError, UnknownNodeError } from "viem"
// import {
//   PaymasterMode,
//   type SponsorUserOperationParameters
// } from "../../paymaster/utils/types"
// import { SponsorUserOperationError } from "../models/SponsorUserOperationError"
// import { getBundlerError } from "./getBundlerError"

// export async function getSponsorUserOperationError(
//   err: BaseError,
//   args: SponsorUserOperationParameters
// ) {
//   const getCause = async () => {
//     const cause = getBundlerError(
//       err as BaseError,
//       args as SponsorUserOperationParameters
//     )
//     if (cause instanceof UnknownNodeError) return err as BaseError
//     return cause
//   }

//   const causeResult = await getCause()

//   throw new SponsorUserOperationError(causeResult, {
//     ...args,
//     mode: PaymasterMode.SPONSORED
//   })
// }
