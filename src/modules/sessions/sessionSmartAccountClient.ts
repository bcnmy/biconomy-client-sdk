import { http, type Chain, type Hex, createWalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  type BuildUserOpOptions,
  type SupportedSigner,
  type Transaction,
  createSmartAccountClient,
  getChain,
} from "../../account";
import type { UserOpResponse } from "../../bundler/index.js";
import {
  type SessionSearchParam,
  createBatchedSessionRouterModule,
  createDANSessionKeyManagerModule,
  createSessionKeyManagerModule,
  type getSingleSessionTxParams,
  resumeSession,
} from "../index.js";
import type { ISessionStorage } from "../interfaces/ISessionStorage";
import type { ModuleInfo, StrictSessionParams } from "../utils/Types";

export type SessionType = "STANDARD" | "BATCHED" | "DISTRIBUTED_KEY";
export type ImpersonatedSmartAccountConfig = Omit<
  BiconomySmartAccountV2Config,
  "signer"
> & {
  accountAddress: Hex;
  chainId: number;
  bundlerUrl: string;
};

export type GetSessionParameters = Parameters<typeof getSingleSessionTxParams>;
export type GetSessionResponse = { params: ModuleInfo };

export type SendSessionTransactionFunction = (
  getParameters: GetSessionParameters,
  manyOrOneTransactions: Transaction | Transaction[],
  buildUseropDto?: BuildUserOpOptions,
) => Promise<UserOpResponse>;

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
 * @param sessionType - {@link SessionType}: One of "STANDARD", "BATCHED" or "DISTRIBUTED_KEY". Default is "STANDARD".
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
 *   "DEFAULT_STORE" // Can be omitted if using default session storage (localStorage in browser, fileStorage in node backend)
 * )
 *
 * // The smartAccountWithSession instance can now be used to interact with the blockchain on behalf of the user in the same manner as a regular smart account instance.
 * // smartAccountWithSession.sendTransaction(...) etc.
 *
 */
export const createSessionSmartAccountClient = async (
  biconomySmartAccountConfig: ImpersonatedSmartAccountConfig,
  conditionalSession: SessionSearchParam | "DEFAULT_STORE",
  sessionType?: SessionType | boolean, // boolean for backwards compatibility
): Promise<BiconomySmartAccountV2> => {
  // for backwards compatibility
  let defaultedSessionType: SessionType = "STANDARD";
  if (sessionType === true || sessionType === "BATCHED")
    defaultedSessionType = "BATCHED";
  if (sessionType === "DISTRIBUTED_KEY") defaultedSessionType = "DISTRIBUTED_KEY";

  const defaultedSessionStore = conditionalSession !== "DEFAULT_STORE" ? conditionalSession : biconomySmartAccountConfig.accountAddress;
  const { sessionStorageClient, sessionIDInfo } = await resumeSession(defaultedSessionStore);
  const account = privateKeyToAccount(generatePrivateKey());

  const chain =
    biconomySmartAccountConfig.viemChain ??
    biconomySmartAccountConfig.customChain ??
    getChain(biconomySmartAccountConfig.chainId);

  const incompatibleSigner = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  // Obselete & flow removed from docs but will keep for backwards compatibility reasons.
  let sessionData: ModuleInfo | undefined;
  try {
    const sessionID = sessionIDInfo?.[0]; // Default to the first element to find the signer
    const sessionSigner = await sessionStorageClient.getSignerBySession(
      {
        sessionID,
      },
      chain,
    );

    sessionData =
      defaultedSessionType === "STANDARD"
        ? {
          sessionID,
          sessionSigner,
        }
        : undefined;
  } catch (e) { }

  const sessionModule = await createSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient,
  });

  const batchedSessionValidationModule = await createBatchedSessionRouterModule(
    {
      smartAccountAddress: biconomySmartAccountConfig.accountAddress,
      sessionKeyManagerModule: sessionModule,
    },
  );
  const danSessionValidationModule = await createDANSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient,
  });

  const activeValidationModule =
    defaultedSessionType === "BATCHED"
      ? batchedSessionValidationModule
      : defaultedSessionType === "STANDARD"
        ? sessionModule
        : danSessionValidationModule;

  return await createSmartAccountClient({
    ...biconomySmartAccountConfig,
    signer: incompatibleSigner, // This is a dummy signer, it will remain unused
    activeValidationModule,
    sessionData,
    sessionType: defaultedSessionType,
    sessionStorageClient,
  });
};

/**
 *
 * @param privateKey - The private key of the user's account
 * @param chain - The chain object
 * @returns {@link SupportedSigner} - A signer object that can be used to sign transactions
 */
export const toSupportedSigner = (
  privateKey: string,
  chain: Chain,
): SupportedSigner => {
  const parsedPrivateKey: Hex = privateKey.startsWith("0x")
    ? (privateKey as Hex)
    : `0x${privateKey}`;
  const account = privateKeyToAccount(parsedPrivateKey);
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
};

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
  chain: Chain,
): StrictSessionParams[] =>
  sessionIDs.map((sessionID) => ({
    sessionID,
    sessionSigner: toSupportedSigner(privateKey, chain),
  }));
