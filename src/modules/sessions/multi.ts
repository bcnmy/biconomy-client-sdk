import type { Hex } from "viem"
import {
  type CreateSessionDataParams,
  DEFAULT_ABI_SVM_MODULE,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  type SessionGrantedPayload,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule
} from ".."
import {
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES,
  type Transaction
} from "../../account"
import type { ISessionStorage } from "../interfaces/ISessionStorage"

export type CreateMultiSessionConfig = {
  /** The storage client to be used for storing the session data */
  sessionStorageClient: ISessionStorage
  /** An array of session configurations */
  leaves: CreateSessionDataParams[]
}

/**
 *
 * createMultiSession
 *
 * Creates a session manager that handles multipliple sessions at once for a given user's smart account.
 * Useful for handling multiple granted sessions at once.
 *
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param sessionKeyAddress - The address of the sessionKey upon which the policy is to be imparted.
 * @param multiSessionConfig - An array of session configurations {@link CreateMultiSessionConfig}.
 * @param buildUseropDto - Optional. {@link BuildUserOpOptions}
 * @returns Promise<{@link SessionGrantedPayload}> - An object containing the status of the transaction and the sessionID.
 *
 * @example
 *
 * ```typescript
 * import { createClient } from "viem"
 * import { createSmartAccountClient } from "@biconomy-devx/account"
 * import { createWalletClient, http } from "viem";
 * import { polygonAmoy } from "viem/chains";
 *
 * const signer = createWalletClient({
 *   account,
 *   chain: polygonAmoy,
 *   transport: http(),
 * });
 *
 * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, paymasterUrl }); // Retrieve bundler/paymaster url from dashboard
 * const smartAccountAddress = await smartAccount.getAccountAddress();
 * const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
 * const sessionStorage = new SessionFileStorage(smartAccountAddress);
 * const sessionKeyAddress = (await sessionStorage.addSigner(polygonAmoy)).getAddress();
 *
 *  const leaves: CreateSessionDataParams[] = [
 *    createERC20SessionDatum({
 *      interval: {
 *        validUntil: 0,
 *        validAfter: 0
 *      },
 *      sessionKeyAddress,
 *      sessionKeyData: encodeAbiParameters(
 *        [
 *          { type: "address" },
 *          { type: "address" },
 *          { type: "address" },
 *          { type: "uint256" }
 *        ],
 *        [sessionKeyAddress, token, recipient, amount]
 *      )
 *    }),
 *    createABISessionDatum({
 *      interval: {
 *        validUntil: 0,
 *        validAfter: 0
 *      },
 *      sessionKeyAddress,
 *      contractAddress: nftAddress,
 *      functionSelector: "safeMint(address)",
 *      rules: [
 *        {
 *          offset: 0,
 *          condition: 0,
 *          referenceValue: pad(smartAccountAddress, { size: 32 })
 *        }
 *      ],
 *      valueLimit: 0n
 *    })
 *  ]
 *
 *  const { wait, sessionID } = await createMultiSession(
 *    smartAccount,
 *    sessionKeyAddress,
 *    {
 *      sessionStorageClient: sessionStorage,
 *      leaves
 *    },
 *    {
 *      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
 *    }
 *  )
 *
 *  const {
 *    receipt: { transactionHash },
 *    success
 *  } = await wait();
 *
 *  console.log({ sessionID, success }); // Use the sessionID later to retrieve the sessionKey from the storage client
 *
 * ```
 */

export const createMultiSession = async (
  smartAccount: BiconomySmartAccountV2,
  sessionKeyAddress: Hex,
  { sessionStorageClient, leaves }: CreateMultiSessionConfig,
  buildUseropDto?: BuildUserOpOptions
): Promise<SessionGrantedPayload> => {
  const userAccountAddress = await smartAccount.getAddress()

  const sessionsModule = await createSessionKeyManagerModule({
    smartAccountAddress: userAccountAddress,
    sessionStorageClient
  })

  // Create batched session module
  const batchedSessionModule = await createBatchedSessionRouterModule({
    smartAccountAddress: userAccountAddress,
    sessionKeyManagerModule: sessionsModule
  })

  const { data: policyData } =
    await batchedSessionModule.createSessionData(leaves)

  const permitTx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData
  }

  const isDeployed = await smartAccount.isAccountDeployed()
  if (!isDeployed) throw new Error(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED)

  const txs: Transaction[] = []
  const [isSessionModuleEnabled, isBatchedSessionModuleEnabled] =
    await Promise.all([
      smartAccount.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE),
      smartAccount.isModuleEnabled(DEFAULT_BATCHED_SESSION_ROUTER_MODULE)
    ])

  if (!isSessionModuleEnabled) {
    txs.push(
      await smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE)
    )
  }
  if (!isBatchedSessionModuleEnabled) {
    txs.push(
      await smartAccount.getEnableModuleData(
        DEFAULT_BATCHED_SESSION_ROUTER_MODULE
      )
    )
  }
  txs.push(permitTx)

  const userOpResponse = await smartAccount.sendTransaction(txs, buildUseropDto)

  const sessionID =
    (
      await sessionStorageClient.getSessionData({
        sessionPublicKey: sessionKeyAddress,
        sessionValidationModule: DEFAULT_ABI_SVM_MODULE
      })
    ).sessionID ?? ""

  return {
    session: {
      sessionStorageClient,
      sessionID
    },
    ...userOpResponse
  }
}
