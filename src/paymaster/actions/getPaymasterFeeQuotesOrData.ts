// import type { PaymasterClient } from "../createPaymasterClient"
// import { deepHexlify } from "../utils/helpers"
// import type {
//   FeeQuoteOrDataParameters,
//   FeeQuotesOrDataERC20Response
// } from "../utils/types"
// import type { FeeQuotesOrDataSponsoredResponse } from "./../utils/types"

// export const getPaymasterFeeQuotesOrData = async (
//   client: PaymasterClient,
//   args: FeeQuoteOrDataParameters
// ): Promise<FeeQuotesOrDataERC20Response | FeeQuotesOrDataSponsoredResponse> => {
//   const response = await client.request({
//     method: "pm_getFeeQuoteOrData",
//     params: [
//       deepHexlify(args.userOperation),
//       {
//         mode: args.mode,
//         calculateGasLimits: args.calculateGasLimits ?? true,
//         expiryDuration: args.expiryDuration,
//         tokenInfo: {
//           tokenList: args.tokenList ?? [],
//           preferredToken: args.preferredToken
//         },
//         sponsorshipInfo: {
//           webhookData: args.webhookData,
//           smartAccountInfo: {
//             name: "BICONOMY",
//             version: "2.0.0"
//           }
//         }
//       }
//     ]
//   })

//   return response
// }
