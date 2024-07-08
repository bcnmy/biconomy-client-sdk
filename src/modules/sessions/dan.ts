import { getPublicKeyAsync } from "@noble/ed25519";
import {
  EOAAuth,
  type KeygenResponse,
  NetworkSigner,
  WalletProviderServiceClient,
} from "@silencelaboratories/walletprovider-sdk";
import type { Chain, Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { type Session, createDANSessionKeyManagerModule } from "../";
import {
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES,
  Logger,
  type Transaction,
  isWalletClient,
} from "../../account";
import { extractChainIdFromBundlerUrl } from "../../bundler";
import type { ISessionStorage } from "../interfaces/ISessionStorage";
import { getDefaultStorageClient } from "../session-storage/utils";
import {
  DAN_BACKEND_URL,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
} from "../utils/Constants";
import {
  type IBrowserWallet,
  NodeWallet,
  type SessionSearchParam,
  computeAddress,
  didProvideFullSession,
  hexToUint8Array,
  resumeSession,
} from "../utils/Helper";
import type { DanModuleInfo } from "../utils/Types";
import {
  type Policy,
  type SessionGrantedPayload,
  createABISessionDatum,
} from "./abi";

export type PolicyWithoutSessionKey = Omit<Policy, "sessionKeyAddress">;
export const DEFAULT_SESSION_DURATION = 60 * 60;
/**
 *
 * createDistributedSession
 *
 * Creates a session for a user's smart account.
 * This grants a dapp permission to execute a specific function on a specific contract on behalf of a user.
 * Permissions can be specified by the dapp in the form of rules{@link Rule}, and then submitted to the user for approval via signing.
 * The session keys granted with the imparted policy are stored in a StorageClient {@link ISessionStorage}. They can later be retrieved and used to validate userops.
 *
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param policy - An array of session configurations {@link Policy}.
 * @param sessionStorageClient - The storage client to store the session keys. {@link ISessionStorage}
 * @param buildUseropDto - Optional. {@link BuildUserOpOptions}
 * @returns Promise<{@link SessionGrantedPayload}> - An object containing the status of the transaction and the sessionID.
 *
 * @example
 *
 * ```typescript
 *
 * import { type PolicyWithoutSessionKey, type Session, createDistributedSession } from "@biconomy/account"
 *
 * const policy: PolicyWithoutSessionKey[] = [{
 *   contractAddress: nftAddress,
 *   functionSelector: "safeMint(address)",
 *   rules: [
 *     {
 *       offset: 0,
 *       condition: 0,
 *       referenceValue: smartAccountAddress
 *     }
 *   ],
 *   interval: {
 *     validUntil: 0,
 *     validAfter: 0
 *   },
 *   valueLimit: 0n
 * }]
 *
 * const { wait, session } = await createDistributedSession(
 *   smartAccountClient,
 *   policy
 * )
 *
 * const { success } = await wait()
 *
 * ```
 */

export const createDistributedSession = async (
  smartAccount: BiconomySmartAccountV2,
  policy: PolicyWithoutSessionKey[],
  sessionStorageClient?: ISessionStorage,
  buildUseropDto?: BuildUserOpOptions,
  chain?: number,
  browserWallet?: IBrowserWallet,
): Promise<SessionGrantedPayload> => {
  const defaultedChainId =
    chain ??
    extractChainIdFromBundlerUrl(smartAccount?.bundler?.getBundlerUrl() ?? "");
  if (!defaultedChainId) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND);
  }
  const smartAccountAddress = await smartAccount.getAddress();
  const defaultedSessionStorageClient =
    sessionStorageClient || getDefaultStorageClient(smartAccountAddress);

  const sessionsModule = await createDANSessionKeyManagerModule({
    smartAccountAddress,
    sessionStorageClient: defaultedSessionStorageClient,
  });

  let duration = DEFAULT_SESSION_DURATION;
  if (policy?.[0].interval?.validUntil) {
    duration = Math.round(policy?.[0].interval?.validUntil - Date.now() / 1000);
  }

  const { sessionKeyEOA: sessionKeyAddress, ...other } = await getDANSessionKey(
    smartAccount,
    browserWallet,
    undefined,
    duration,
  );

  const danModuleInfo: DanModuleInfo = { ...other, chainId: defaultedChainId };
  const defaultedPolicy: Policy[] = policy.map((p) => ({
    ...p,
    sessionKeyAddress,
  }));

  const humanReadablePolicyArray = defaultedPolicy.map((p) =>
    createABISessionDatum({ ...p, danModuleInfo }),
  );

  const { data: policyData, sessionIDInfo } =
    await sessionsModule.createSessionData(humanReadablePolicyArray);

  const permitTx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData,
  };

  const txs: Transaction[] = [];

  const isDeployed = await smartAccount.isAccountDeployed();
  const enableSessionTx = await smartAccount.getEnableModuleData(
    DEFAULT_SESSION_KEY_MANAGER_MODULE,
  );

  if (isDeployed) {
    const enabled = await smartAccount.isModuleEnabled(
      DEFAULT_SESSION_KEY_MANAGER_MODULE,
    );
    if (!enabled) {
      txs.push(enableSessionTx);
    }
  } else {
    Logger.log(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED);
    txs.push(enableSessionTx);
  }

  txs.push(permitTx);

  const userOpResponse = await smartAccount.sendTransaction(
    txs,
    buildUseropDto,
  );

  smartAccount.setActiveValidationModule(sessionsModule);

  return {
    session: {
      sessionStorageClient: defaultedSessionStorageClient,
      sessionIDInfo,
    },
    ...userOpResponse,
  };
};

export const getDANSessionKey = async (
  smartAccount: BiconomySmartAccountV2,
  browserWallet?: IBrowserWallet,
  { threshold = 11, partiesNumber = 20 }: Partial<DanModuleInfo> = {},
  duration = DEFAULT_SESSION_DURATION,
) => {
  const eoaAddress = (await smartAccount.getSigner().getAddress()) as Hex; // Smart account owner
  const innerSigner = smartAccount.getSigner().inner;

  if (!browserWallet && !isWalletClient(innerSigner))
    throw new Error(ERROR_MESSAGES.INVALID_BROWSER_WALLET);
  const wallet =
    browserWallet ?? new NodeWallet(smartAccount.getSigner().inner);

  const hexEphSK = generatePrivateKey();
  const hexEphSKWithout0x = hexEphSK.slice(2);

  const ephSK: Uint8Array = hexToUint8Array(hexEphSKWithout0x);
  const ephPK: Uint8Array = await getPublicKeyAsync(ephSK);

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl: DAN_BACKEND_URL,
  });

  const eoaAuth = new EOAAuth(eoaAddress, wallet, ephPK, duration);
  const sdk = new NetworkSigner(wpClient, threshold, partiesNumber, eoaAuth);

  // Generate a new key
  const resp: KeygenResponse = await sdk.authenticateAndCreateKey(ephPK);

  const pubKey = resp.publicKey;
  const mpcKeyId = resp.keyId as Hex;

  const sessionKeyEOA = computeAddress(pubKey);

  return {
    sessionKeyEOA,
    mpcKeyId,
    hexEphSKWithout0x,
    partiesNumber,
    threshold,
    eoaAddress,
  };
};

export type DanSessionParamsPayload = {
  params: {
    sessionID: string;
    danModuleInfo: DanModuleInfo;
  };
};
/**
 * getDanSessionTxParams
 *
 * Retrieves the transaction parameters for a batched session.
 *
 * @param correspondingIndex - An index for the transaction corresponding to the relevant session. If not provided, the last session index is used.
 * @param conditionalSession - {@link SessionSearchParam} The session data that contains the sessionID and sessionSigner. If not provided, The default session storage (localStorage in browser, fileStorage in node backend) is used to fetch the sessionIDInfo
 * @returns Promise<{@link DanSessionParamsPayload}> - session parameters.
 *
 */
export const getDanSessionTxParams = async (
  conditionalSession: SessionSearchParam,
  chain: Chain,
  correspondingIndex?: number | null | undefined,
): Promise<DanSessionParamsPayload> => {
  const defaultedCorrespondingIndex = Array.isArray(correspondingIndex)
    ? correspondingIndex[0]
    : correspondingIndex;
  const resumedSession = await resumeSession(conditionalSession);
  // if correspondingIndex is null then use the last session.
  const allSessions =
    await resumedSession.sessionStorageClient.getAllSessionData();

  const sessionID = didProvideFullSession(conditionalSession)
    ? (conditionalSession as Session).sessionIDInfo[
        defaultedCorrespondingIndex ?? 0
      ]
    : allSessions[defaultedCorrespondingIndex ?? allSessions.length - 1]
        .sessionID;

  const matchingLeafDatum = allSessions.find((s) => s.sessionID === sessionID);

  if (!sessionID) throw new Error(ERROR_MESSAGES.MISSING_SESSION_ID);
  if (!matchingLeafDatum) throw new Error(ERROR_MESSAGES.NO_LEAF_FOUND);
  if (!matchingLeafDatum.danModuleInfo)
    throw new Error(ERROR_MESSAGES.NO_DAN_MODULE_INFO);
  const chainIdsMatch = chain.id === matchingLeafDatum?.danModuleInfo?.chainId;
  if (!chainIdsMatch) throw new Error(ERROR_MESSAGES.CHAIN_ID_MISMATCH);

  return {
    params: {
      sessionID,
      danModuleInfo: matchingLeafDatum.danModuleInfo,
    },
  };
};
