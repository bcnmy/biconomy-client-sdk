// import type { BaseError } from "viem"
// import type { BytesLike } from "../../accounts/utils/types"
// import { getSponsorUserOperationError } from "../../errors/getters"
// import type { PaymasterClient } from "../createPaymasterClient"
// import { deepHexlify } from "../utils/helpers"
// import type {
//   SponsorUserOperationParameters,
//   SponsorUserOperationReturnType
// } from "../utils/types"

// export const sponsorUserOperation = async (
//   client: PaymasterClient,
//   args: SponsorUserOperationParameters
// ): Promise<SponsorUserOperationReturnType> => {
//   try {
//     const response = await client.request({
//       method: "pm_sponsorUserOperation",
//       params: [
//         deepHexlify(args.userOperation),
//         {
//           mode: args.mode,
//           calculateGasLimits: args.calculateGasLimits ?? true,
//           expiryDuration: args.expiryDuration,
//           tokenInfo: args.tokenInfo,
//           sponsorshipInfo: {
//             webhookData: args.webhookData,
//             smartAccountInfo: {
//               name: "BICONOMY",
//               version: "2.0.0"
//             }
//           }
//         }
//       ]
//     })

//     const responseV06 = response as {
//       paymasterAndData: BytesLike
//       preVerificationGas: string
//       verificationGasLimit: string
//       callGasLimit: string
//     }

//     return {
//       paymasterAndData: responseV06.paymasterAndData,
//       preVerificationGas: responseV06.preVerificationGas,
//       verificationGasLimit: responseV06.verificationGasLimit,
//       callGasLimit: responseV06.callGasLimit
//     } as SponsorUserOperationReturnType
//   } catch (err) {
//     throw await getSponsorUserOperationError(err as BaseError, args)
//   }
// }
