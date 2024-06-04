import type { Client } from "viem"
import { getPaymasterFeeQuotesOrData } from "../../paymaster/actions/getPaymasterFeeQuotesOrData"
import { sponsorUserOperation } from "../../paymaster/actions/sponsorUserOperation"
import type { PaymasterClient } from "../../paymaster/createPaymasterClient"
import type {
  FeeQuoteOrDataParameters,
  FeeQuotesOrDataERC20Response,
  FeeQuotesOrDataSponsoredResponse,
  SponsorUserOperationParameters,
  SponsorUserOperationReturnType
} from "../../paymaster/utils/types"

export type PaymasterClientActions = {
  /**
   * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
   *
   *
   * @param args {@link SponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
   * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
   *
   * @example
   * import { createClient } from "viem"
   * import { paymasterActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(paymasterUrl)
   * }).extend(paymasterActions)
   *
   * await bundlerClient.sponsorUserOperation(bundlerClient, {
   *      userOperation: userOperationWithDummySignature,
   *      entryPoint: entryPoint
   * }})
   *
   */
  sponsorUserOperation: (
    args: SponsorUserOperationParameters
  ) => Promise<SponsorUserOperationReturnType>

  getPaymasterFeeQuotesOrData: (
    args: FeeQuoteOrDataParameters
  ) => Promise<FeeQuotesOrDataERC20Response | FeeQuotesOrDataSponsoredResponse>

  /**
   * Returns all the Paymaster addresses associated with an EntryPoint that’s owned by this service.
   *
   *
   * @param args {@link AccountsParameters} entryPoint for which you want to get list of supported paymasters.
   * @returns paymaster addresses
   *
   * @example
   * import { createClient } from "viem"
   * import { paymasterActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(paymasterUrl)
   * }).extend(paymasterActions)
   *
   * await bundlerClient.accounts(bundlerClient, {
   *      entryPoint: entryPoint
   * }})
   *
   */
  // accounts: (args: AccountsParameters) => Promise<Address[]>
}

export const paymasterActions =
  () =>
  (client: Client): PaymasterClientActions => ({
    sponsorUserOperation: async (args) =>
      sponsorUserOperation(client as PaymasterClient, {
        ...args
      }),
    getPaymasterFeeQuotesOrData: async (args) =>
      getPaymasterFeeQuotesOrData(client as PaymasterClient, args)
    // accounts: async (args) =>
    // accounts(client as PaymasterClient, args)
  })
