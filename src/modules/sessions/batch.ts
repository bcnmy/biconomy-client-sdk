import type { Chain } from "viem"
import {
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES,
  Logger,
  type Transaction,
  isNullOrUndefined
} from "../../account"
import {
  type CreateSessionDataParams,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  type Session,
  type SessionGrantedPayload,
  type SessionParams,
  type SessionSearchParam,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule,
  didProvideFullSession,
  resumeSession
} from "../index.js"
import type { ISessionStorage } from "../interfaces/ISessionStorage"

export type CreateBatchSessionConfig = {
  /** The storage client to be used for storing the session data */
  sessionStorageClient: ISessionStorage
  /** An array of session configurations */
  leaves: CreateSessionDataParams[]
}

/**
 *
 * createBatchSession
 *
 * Creates a session manager that handles multiple sessions at once for a given user's smart account.
 * Useful for handling multiple granted sessions at once.
 *
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param sessionKeyAddress - The address of the sessionKey upon which the policy is to be imparted.
 * @param batchSessionConfig - An array of session configurations {@link CreateBatchSessionConfig}.
 * @param buildUseropDto - Optional. {@link BuildUserOpOptions}
 * @returns Promise<{@link SessionGrantedPayload}> - An object containing the status of the transaction and the sessionID.
 *
 * @example
 *
 * ```typescript
 * import { createClient } from "viem"
 * import { createSmartAccountClient } from "@biconomy/account"
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
 * const sessionKeyAddress = (await sessionStorage.addSigner(undefined, polygonAmoy)).getAddress();
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
 *          referenceValue: smartAccountAddress
 *        }
 *      ],
 *      valueLimit: 0n
 *    })
 *  ]
 *
 *  const { wait, sessionID } = await createBatchSession(
 *    smartAccount,
 *    sessionStorageClient: sessionStorage,
 *    leaves,
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

export const createBatchSession = async (
  smartAccount: BiconomySmartAccountV2,
  /** The storage client to be used for storing the session data */
  sessionStorageClient: ISessionStorage,
  /** An array of session configurations */
  leaves: CreateSessionDataParams[],
  buildUseropDto?: BuildUserOpOptions
): Promise<SessionGrantedPayload> => {
  const smartAccountAddress = await smartAccount.getAddress()

  const sessionsModule = await createSessionKeyManagerModule({
    smartAccountAddress,
    sessionStorageClient
  })

  // Create batched session module
  const batchedSessionModule = await createBatchedSessionRouterModule({
    smartAccountAddress,
    sessionKeyManagerModule: sessionsModule
  })

  const { data: policyData, sessionIDInfo } =
    await batchedSessionModule.createSessionData(leaves)

  const permitTx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData
  }

  const isDeployed = await smartAccount.isAccountDeployed()

  const txs: Transaction[] = []
  const enableSessionKeyTx = await smartAccount.getEnableModuleData(
    DEFAULT_SESSION_KEY_MANAGER_MODULE
  )
  const enableBatchedSessionTx = await smartAccount.getEnableModuleData(
    DEFAULT_BATCHED_SESSION_ROUTER_MODULE
  )
  if (isDeployed) {
    const [isSessionModuleEnabled, isBatchedSessionModuleEnabled] =
      await Promise.all([
        smartAccount.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE),
        smartAccount.isModuleEnabled(DEFAULT_BATCHED_SESSION_ROUTER_MODULE)
      ])

    if (!isSessionModuleEnabled) {
      txs.push(enableSessionKeyTx)
    }
    if (!isBatchedSessionModuleEnabled) {
      txs.push(enableBatchedSessionTx)
    }
  } else {
    Logger.log(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED)
    txs.push(enableSessionKeyTx, enableBatchedSessionTx)
  }

  txs.push(permitTx)

  const userOpResponse = await smartAccount.sendTransaction(txs, buildUseropDto)

  return {
    session: {
      sessionStorageClient,
      sessionIDInfo
    },
    ...userOpResponse
  }
}

export type BatchSessionParamsPayload = {
  params: { batchSessionParams: SessionParams[] }
}
/**
 * getBatchSessionTxParams
 *
 * Retrieves the transaction parameters for a batched session.
 *
 * @param transactions - An array of {@link Transaction}s.
 * @param correspondingIndexes - An array of indexes for the transactions corresponding to the relevant session. If not provided, the last {transaction.length} sessions are used.
 * @param conditionalSession - {@link SessionSearchParam} The session data that contains the sessionID and sessionSigner. If not provided, The default session storage (localStorage in browser, fileStorage in node backend) is used to fetch the sessionIDInfo
 * @param chain - The chain.
 * @returns Promise<{@link BatchSessionParamsPayload}> - session parameters.
 *
 */
export const getBatchSessionTxParams = async (
  transactions: Transaction[],
  correspondingIndexes: number[] | null,
  conditionalSession: SessionSearchParam,
  chain: Chain
): Promise<BatchSessionParamsPayload> => {
  if (
    correspondingIndexes &&
    correspondingIndexes.length !== transactions.length
  ) {
    throw new Error(ERROR_MESSAGES.INVALID_SESSION_INDEXES)
  }

  const { sessionStorageClient } = await resumeSession(conditionalSession)
  let sessionIDInfo: string[] = []

  const allSessions = await sessionStorageClient.getAllSessionData()
  if (didProvideFullSession(conditionalSession)) {
    sessionIDInfo = (conditionalSession as Session).sessionIDInfo
  } else if (isNullOrUndefined(correspondingIndexes)) {
    sessionIDInfo = allSessions
      .slice(-transactions.length)
      .map(({ sessionID }) => sessionID as string)
  } else {
    sessionIDInfo = (correspondingIndexes ?? []).map(
      (index) => allSessions[index].sessionID as string
    )
  }

  const sessionSigner = await sessionStorageClient.getSignerBySession(
    {
      sessionID: sessionIDInfo[0]
    },
    chain
  )

  return {
    params: {
      batchSessionParams: sessionIDInfo.map(
        (sessionID): SessionParams => ({
          sessionSigner,
          sessionID
        })
      )
    }
  }
}
