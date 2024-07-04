import { http, type Chain, type Hex, createWalletClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  type BuildUserOpOptions,
  type SupportedSigner,
  createSmartAccountClient,
  getChain,
  type Transaction
} from "../../account"
import {
  type SessionSearchParam,
  createBatchedSessionRouterModule,
  createDANSessionKeyManagerModule,
  createSessionKeyManagerModule,
  getBatchSessionTxParams,
  getDanSessionTxParams,
  getSingleSessionTxParams,
  resumeSession
} from "../index.js"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import type { StrictSessionParams } from "../utils/Types"
import { FunctionOrConstructorTypeNodeBase } from "typescript"
import type { UserOpResponse } from "../../bundler/index.js"

export type SessionType = "SINGLE" | "BATCHED" | "DAN"
export type ImpersonatedSmartAccountConfig = Omit<
  BiconomySmartAccountV2Config,
  "signer"
> & {
  accountAddress: Hex
  chainId: number
  bundlerUrl: string
}

export type GetDanSessionParameters = Parameters<typeof getDanSessionTxParams>
export type GetBatchSessionParameters = Parameters<typeof getBatchSessionTxParams>
export type GetSingleSessionParameters = Parameters<typeof getSingleSessionTxParams>

export type GetSessionParameters = GetDanSessionParameters | GetBatchSessionParameters | GetSingleSessionParameters

export type SendSessionTransaction = {
  sendSessionTransaction: (getParameters: GetSessionParameters, manyOrOneTransactions: Transaction | Transaction[], buildUseropDto?: BuildUserOpOptions
  ) => Promise<UserOpResponse>
}
export type DanSessionAccount = BiconomySmartAccountV2 & { getSessionParams(p: GetDanSessionParameters): ReturnType<typeof getDanSessionTxParams> } & SendSessionTransaction
export type BatchedSessionAccount = BiconomySmartAccountV2 & { getSessionParams(p: GetBatchSessionParameters): ReturnType<typeof getBatchSessionTxParams> } & SendSessionTransaction
export type SingleSessionAccount = BiconomySmartAccountV2 & { getSessionParams(p: GetSingleSessionParameters): ReturnType<typeof getSingleSessionTxParams> } & SendSessionTransaction

export type SessionSmartAccountClient =
  | SingleSessionAccount
  | BatchedSessionAccount
  | DanSessionAccount

/**
 *
 * createSessionSmartAccountClient
 *
 * Creates a new instance of BiconomySmartAccountV2 class. This is used to impersonate a users smart account by a dapp, for use
 * with a valid session that has previously been granted by the user. A dummy signer is passed into the smart account instance, which cannot be used.
 * The sessionSigner is used instead for signing transactions, which is fetched from the session storage using the sessionID. {@link ISessionStorage}
 *
 * @param biconomySmartAccountConfig - Configuration for initializing the BiconomySmartAccountV2 instance {@link ImpersonatedSmartAccountConfig}.
 * @param conditionalSession - {@link SessionSearchParam} The session data that contains the sessionID and sessionSigner. If not provided, The default session storage (localStorage in browser, fileStorage in node backend) is used to fetch the sessionIDInfo
 * @param sessionType - {@link SessionType}: One of "SINGLE", "BATCHED" or "DAN". Default is "SINGLE".
 * @returns A promise that resolves to a new instance of {@link BiconomySmartAccountV2}.
 * @throws An error if something is wrong with the smart account instance creation.
 *
 * @example
 * import { createClient } from "viem"
 * import { createSmartAccountClient, BiconomySmartAccountV2 } from "@biconomy/account"
 * import { createWalletClient, http } from "viem";
 * import { polygonAmoy } from "viem/chains";
 * import { SessionFileStorage } from "@biconomy/session-file-storage";
 *
 * const signer = createWalletClient({
 *   account,
 *   chain: polygonAmoy,
 *   transport: http(),
 * });
 *
 *
 * // The following fields are required to create a session smart account client
 * const smartAccountAddress = '0x...';
 * const sessionStorage = new SessionFileStorage(smartAccountAddress);
 * const sessionKeyAddress = '0x...';
 * const sessionID = '0x...';
 *
 * const smartAccountWithSession = await createSessionSmartAccountClient(
 *   {
 *     accountAddress: smartAccountAddress, // Set the account address on behalf of the user
 *     bundlerUrl,
 *     paymasterUrl,
 *     chainId
 *   },
 *   storeForSingleSession // Can be ommitted if using default session storage (localStorage in browser, fileStorage in node backend)
 * )
 *
 * // The smartAccountWithSession instance can now be used to interact with the blockchain on behalf of the user in the same manner as a regular smart account instance.
 * // smartAccountWithSession.sendTransaction(...) etc.
 *
 */
export const createSessionSmartAccountClient = async (
  biconomySmartAccountConfig: ImpersonatedSmartAccountConfig,
  conditionalSession: SessionSearchParam,
  _sessionType?: SessionType | boolean // backwards compatibility
): Promise<SessionSmartAccountClient> => {
  // for backwards compatibility
  let sessionType = "SINGLE"
  if (_sessionType === true || _sessionType === "BATCHED")
    sessionType = "BATCHED"
  if (_sessionType === "DAN") sessionType = "DAN"

  const { sessionStorageClient } = await resumeSession(
    conditionalSession ?? biconomySmartAccountConfig.accountAddress
  )
  const account = privateKeyToAccount(generatePrivateKey())

  const chain =
    biconomySmartAccountConfig.viemChain ??
    biconomySmartAccountConfig.customChain ??
    getChain(biconomySmartAccountConfig.chainId)

  const incompatibleSigner = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const sessionModule = await createSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient
  })

  const batchedSessionValidationModule = await createBatchedSessionRouterModule(
    {
      smartAccountAddress: biconomySmartAccountConfig.accountAddress,
      sessionKeyManagerModule: sessionModule
    }
  )
  const danSessionValidationModule = await createDANSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient
  })

  const activeValidationModule =
    sessionType === "BATCHED"
      ? batchedSessionValidationModule
      : sessionType === "SINGLE"
        ? sessionModule
        : danSessionValidationModule

  const getSessionParams =
    sessionType === "BATCHED"
      ? getBatchSessionTxParams
      : sessionType === "SINGLE"
        ? getSingleSessionTxParams
        : getDanSessionTxParams

  const smartAccount = await createSmartAccountClient({
    ...biconomySmartAccountConfig,
    signer: incompatibleSigner, // This is a dummy signer, it will remain unused
    activeValidationModule
  })

  smartAccount.getSessionParams = getSessionParams;

  return sessionType === "BATCHED"
    ? smartAccount as BatchedSessionAccount
    : sessionType === "SINGLE"
      ? smartAccount as SingleSessionAccount
      : smartAccount as DanSessionAccount
}

/**
 *
 * @param privateKey - The private key of the user's account
 * @param chain - The chain object
 * @returns {@link SupportedSigner} - A signer object that can be used to sign transactions
 */
export const toSupportedSigner = (
  privateKey: string,
  chain: Chain
): SupportedSigner => {
  const parsedPrivateKey: Hex = privateKey.startsWith("0x")
    ? (privateKey as Hex)
    : `0x${privateKey}`
  const account = privateKeyToAccount(parsedPrivateKey)
  return createWalletClient({
    account,
    chain,
    transport: http()
  })
}

/**
 *
 * @param privateKey The private key of the user's account
 * @param sessionIDs An array of sessionIDs
 * @param chain The chain object
 * @returns {@link StrictSessionParams[]} - An array of session parameters {@link StrictSessionParams} that can be used to sign transactions here {@link BuildUserOpOptions}
 */
export const toSessionParams = (
  privateKey: Hex,
  sessionIDs: string[],
  chain: Chain
): StrictSessionParams[] =>
  sessionIDs.map((sessionID) => ({
    sessionID,
    sessionSigner: toSupportedSigner(privateKey, chain)
  }))
