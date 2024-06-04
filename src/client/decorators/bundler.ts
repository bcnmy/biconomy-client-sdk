import type { Client, Hash } from "viem"
import type { Prettify } from "viem/chains"
import type { SendUserOperationParameters } from "../../accounts/actions/sendUserOperation"
import { ENTRYPOINT_ADDRESS_V07 } from "../../accounts/utils/constants"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "../../accounts/utils/types"
import { estimateUserOperationGas } from "../../bundler"
import { chainId } from "../../bundler/actions/chainId"
import { getGasFeeValues } from "../../bundler/actions/getGasFeeValues"
import {
  type GetUserOperationByHashParameters,
  type GetUserOperationByHashReturnType,
  getUserOperationByHash
} from "../../bundler/actions/getUserOperationByHash"
import {
  type GetUserOperationReceiptParameters,
  getUserOperationReceipt
} from "../../bundler/actions/getUserOperationReceipt"
import { getUserOpStatus } from "../../bundler/actions/getUserOperationStatus"
import { sendUserOperation } from "../../bundler/actions/sendUserOperation"
import {
  type WaitForUserOperationReceiptParameters,
  waitForUserOperationReceipt
} from "../../bundler/actions/waitForUserOperationReceipt"
import type { BundlerClient } from "../../bundler/createBundlerClient"
import type {
  EstimateUserOperationGasParameters,
  GetGasFeeValuesReturnType,
  StateOverrides,
  UserOpReceipt,
  UserOpStatus
} from "../../bundler/utils/types"

export type BundlerActions = {
  /**
   *
   * Sends user operation to the bundler
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @param args {@link SendUserOperationParameters}.
   * @returns UserOpHash that you can use to track user operation as {@link Hash}.
   *
   * @example
   * import { createClient } from "viem"
   * import { bundlerActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(bundlerUrl)
   * }).extend(bundlerActions)
   *
   * const userOpHash = await bundlerClient.sendUserOperation({
   *      userOperation: signedUserOperation
   * })
   *
   * Return "0x...hash"
   */
  sendUserOperation: (
    args: Prettify<Omit<SendUserOperationParameters, "entryPoint">>
  ) => Promise<Hash>
  /**
   *
   * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @param args {@link EstimateUserOperationGasParameters}
   * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link EstimateUserOperationGasReturnType}
   *
   * @example
   * import { createClient } from "viem"
   * import { bundlerActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(BUNDLER_URL)
   * }).extend(bundlerActions)
   *
   * const gasParameters = await bundlerClient.estimateUserOperationGas({
   *     userOperation: signedUserOperation,
   *    entryPoint: entryPoint
   * })
   *
   * // Return {preVerificationGas: 43492n, verificationGasLimit: 59436n, callGasLimit: 9000n}
   */
  estimateUserOperationGas: (
    args: Prettify<Omit<EstimateUserOperationGasParameters, "entryPoint">>,
    stateOverrides?: StateOverrides
  ) => Promise<
    Prettify<{
      preVerificationGas: string
      verificationGasLimit: string
      callGasLimit: string
      maxPriorityFeePerGas: string
      maxFeePerGas: string
    }>
  >
  /**
   *
   * Returns the supported entrypoints by the bundler service
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @returns Supported entryPoints
   *
   * @example
   * import { createClient } from "viem"
   * import { bundlerActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(BUNDLER_URL)
   * }).extend(bundlerActions)
   *
   * const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
   *
   * // Return ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']
   */
  supportedEntryPoints: () => ENTRYPOINT_ADDRESS_V07_TYPE
  /**
   *
   * Returns the supported chain id by the bundler service
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @returns Supported chain id
   *
   * @example
   * import { createClient } from "viem"
   * import { bundlerActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(BUNDLER_URL)
   * }).extend(bundlerActions)
   *
   * const chainId = await bundlerClient.chainId()
   * // Return 5n for Goerli
   */
  chainId: () => Promise<number>
  /**
   *
   * Returns the user operation from userOpHash
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @param args  UserOpHash that was returned by {@link sendUserOperation}
   * @returns userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null
   *
   * @example
   * import { createClient } from "viem"
   * import { bundlerActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(BUNDLER_URL)
   * }).extend(bundlerActions)
   *
   * await bundlerClient.getUserOperationByHash(userOpHash)
   *
   */
  getUserOperationByHash: (
    args: Prettify<GetUserOperationByHashParameters>
  ) => Promise<Prettify<GetUserOperationByHashReturnType> | null>
  /**
   *
   * Returns the user operation receipt from userOpHash
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @param args {@link GetUserOperationReceiptParameters} UserOpHash that was returned by {@link sendUserOperation}
   * @returns user operation receipt {@link GetUserOperationReceiptReturnType} if found or null
   *
   * @example
   * import { createClient } from "viem"
   * import { bundlerActions } from "@biconomy/sdk" // TODO
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http(BUNDLER_URL)
   * }).extend(bundlerActions)
   *
   * await bundlerClient.getUserOperationReceipt({hash: userOpHash})
   *
   */
  getUserOperationReceipt: (
    args: Prettify<{ hash: Hash }>
  ) => Promise<Prettify<UserOpReceipt> | null>

  /**
   * Waits for the User Operation to be included on a [Block](https://viem.sh/docs/glossary/terms.html#block) (one confirmation), and then returns the [User Operation Receipt]
   *
   * - Docs: https://docs.biconomy.io/... // TODO
   *
   * @param client - Bundler Client to use
   * @param parameters - {@link WaitForUserOperationReceiptParameters}
   * @returns The transaction receipt. {@link GetUserOperationReceiptReturnType}
   *
   * @example
   * import { waitForUserOperationReceipt, http } from 'viem'
   * import { createBundlerClient } from "@biconomy/sdk" // TODO
   * import { mainnet } from 'viem/chains'
   *
   * const bundlerClient = createBundlerClient({
   *   chain: mainnet,
   *   transport: http(bundlerUrl),
   * })
   * const userOperationReceipt = await bundlerClient.waitForUserOperationReceipt({
   *   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
   * })
   */
  waitForUserOperationReceipt: (
    args: Prettify<WaitForUserOperationReceiptParameters>
  ) => Promise<Prettify<UserOpReceipt>>

  getGasFeeValues: () => Promise<GetGasFeeValuesReturnType>
  getUserOpStatus: (userOpHash: Hash) => Promise<UserOpStatus>
}

const bundlerActions =
  () =>
  (client: Client): BundlerActions => ({
    sendUserOperation: async (
      args: Omit<SendUserOperationParameters, "entryPoint">
    ): Promise<Hash> =>
      sendUserOperation(client as BundlerClient, {
        ...args
      }),
    estimateUserOperationGas: (
      args: EstimateUserOperationGasParameters,
      stateOverrides?: StateOverrides
    ) =>
      estimateUserOperationGas(
        client as BundlerClient,
        { ...args },
        stateOverrides
      ),
    supportedEntryPoints: (): ENTRYPOINT_ADDRESS_V07_TYPE =>
      ENTRYPOINT_ADDRESS_V07,
    chainId: () => chainId(client as BundlerClient),
    getUserOperationByHash: (args: GetUserOperationByHashParameters) =>
      getUserOperationByHash(client as BundlerClient, args),
    getUserOperationReceipt: (args: GetUserOperationReceiptParameters) =>
      getUserOperationReceipt(client as BundlerClient, args),
    waitForUserOperationReceipt: (
      args: WaitForUserOperationReceiptParameters
    ) => waitForUserOperationReceipt(client as BundlerClient, args),
    getGasFeeValues: () => getGasFeeValues(client as BundlerClient),
    getUserOpStatus: (userOpHash: Hash) =>
      getUserOpStatus(client as BundlerClient, userOpHash)
  })

export { bundlerActions }
