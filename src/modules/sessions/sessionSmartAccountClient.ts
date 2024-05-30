import { http, type Hex, createWalletClient, type Chain } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  createSmartAccountClient,
  getChain,
  type SupportedSigner,
  type BuildUserOpOptions
} from "../../account"
import {
  type SessionSearchParam,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule,
  resumeSession
} from "../index.js"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import type { ModuleInfo, StrictSessionParams } from "../utils/Types"

export type ImpersonatedSmartAccountConfig = Omit<
  BiconomySmartAccountV2Config,
  "signer"
> & {
  accountAddress: Hex
  chainId: number
  bundlerUrl: string
}
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
 * @param multiMode - If true, the smart account instance will use the batchedSessionModule for validation, otherwise a single session is assumed.
 * @returns A promise that resolves to a new instance of {@link BiconomySmartAccountV2}.
 * @throws An error if something is wrong with the smart account instance creation.
 *
 * @example
 * import { createClient } from "viem"
 * import { createSmartAccountClient, BiconomySmartAccountV2 } from "@biconomy/account"
 * import { createWalletClient, http } from "viem";
 * import { polygonAmoy } from "viem/chains";
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
  multiMode = false
): Promise<BiconomySmartAccountV2> => {
  const { sessionStorageClient, sessionIDInfo } = await resumeSession(
    conditionalSession ?? biconomySmartAccountConfig.accountAddress
  )
  const sessionID = sessionIDInfo[0] // Default to the first element to find the signer

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

  const sessionSigner = await sessionStorageClient.getSignerBySession(
    {
      sessionID
    },
    chain
  )

  const sessionData: ModuleInfo | undefined = multiMode
    ? undefined
    : {
        sessionID,
        sessionSigner
      }

  const sessionModule = await createSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient
  })

  const batchedSessionModule = await createBatchedSessionRouterModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionKeyManagerModule: sessionModule
  })

  return await createSmartAccountClient({
    ...biconomySmartAccountConfig,
    signer: incompatibleSigner, // This is a dummy signer, it will remain unused
    activeValidationModule: multiMode ? batchedSessionModule : sessionModule,
    sessionData // contains the sessionSigner that will be used for txs
  })
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
