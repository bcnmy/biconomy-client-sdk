import * as ed from "@noble/ed25519"
import { ProjectivePoint } from "@noble/secp256k1"
import {
  EOAAuth,
  type KeygenResponse,
  NetworkSigner,
  WalletProviderServiceClient
} from "@silencelaboratories/walletprovider-sdk"
import type { Address, Chain, Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { publicKeyToAddress } from "viem/accounts"
import { type Session, createDANSessionKeyManagerModule } from "../"
import {
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES,
  Logger,
  type Transaction
} from "../../account"
import { extractChainIdFromBundlerUrl } from "../../bundler"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import { getDefaultStorageClient } from "../session-storage/utils"
import {
  DAN_BACKEND_URL,
  DEFAULT_SESSION_KEY_MANAGER_MODULE
} from "../utils/Constants"
import {
  NodeWallet,
  type SessionSearchParam,
  didProvideFullSession,
  hexToUint8Array,
  resumeSession
} from "../utils/Helper"
import type { DanModuleInfo } from "../utils/Types"
import {
  type Policy,
  type SessionGrantedPayload,
  createABISessionDatum
} from "./abi"
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
 * ```
 */

export type PolicyWithoutSessionKey = Omit<Policy, "sessionKeyAddress">
export const createDistributedSession = async (
  smartAccount: BiconomySmartAccountV2,
  _policy: PolicyWithoutSessionKey[],
  _sessionStorageClient?: ISessionStorage,
  buildUseropDto?: BuildUserOpOptions,
  _chain?: number
): Promise<SessionGrantedPayload> => {
  const chainId =
    _chain ??
    extractChainIdFromBundlerUrl(smartAccount?.bundler?.getBundlerUrl() ?? "")
  if (!chainId) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }
  const smartAccountAddress = await smartAccount.getAddress()
  const sessionStorageClient =
    _sessionStorageClient || getDefaultStorageClient(smartAccountAddress)
  const sessionsModule = await createDANSessionKeyManagerModule({
    smartAccountAddress,
    sessionStorageClient
  })

  const { sessionKeyEOA: sessionKeyAddress, ...other } =
    await getDANSessionKey(smartAccount)

  const danModuleInfo: DanModuleInfo = { ...other, chainId }
  const policy: Policy[] = _policy.map((p) => ({ ...p, sessionKeyAddress }))
  const humanReadablePolicyArray = policy.map((p) =>
    createABISessionDatum({ ...p, danModuleInfo })
  )

  const { data: policyData, sessionIDInfo } =
    await sessionsModule.createSessionData(humanReadablePolicyArray)

  const permitTx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData
  }

  const txs: Transaction[] = []

  const isDeployed = await smartAccount.isAccountDeployed()
  const enableSessionTx = await smartAccount.getEnableModuleData(
    DEFAULT_SESSION_KEY_MANAGER_MODULE
  )

  if (isDeployed) {
    const enabled = await smartAccount.isModuleEnabled(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )
    if (!enabled) {
      txs.push(enableSessionTx)
    }
  } else {
    Logger.log(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED)
    txs.push(enableSessionTx)
  }

  txs.push(permitTx)

  const userOpResponse = await smartAccount.sendTransaction(txs, buildUseropDto)

  smartAccount.setActiveValidationModule(sessionsModule)

  return {
    session: {
      sessionStorageClient,
      sessionIDInfo
    },
    ...userOpResponse
  }
}

export const computeAddress = (publicKey: string): Address => {
  if (publicKey.startsWith("0x")) {
    publicKey = publicKey.slice(2)
  }

  if (publicKey.startsWith("04")) {
    return publicKeyToAddress(`0x${publicKey} `)
  } else if (publicKey.startsWith("02") || publicKey.startsWith("03")) {
    const uncompressed = ProjectivePoint.fromHex(publicKey).toHex(false)
    return publicKeyToAddress(`0x${uncompressed}`)
  } else {
    throw new Error("Invalid public key")
  }
}

export const getDANSessionKey = async (
  smartAccount: BiconomySmartAccountV2
) => {
  const eoaAddress = (await smartAccount.getSigner().getAddress()) as Hex // Smart account owner
  const wallet = new NodeWallet(smartAccount.getSigner().inner)

  const hexEphSK = generatePrivateKey()
  const hexEphSKWithout0x = hexEphSK.slice(2)

  const ephSK: Uint8Array = hexToUint8Array(hexEphSKWithout0x)
  const ephPK: Uint8Array = await ed.getPublicKeyAsync(ephSK)

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl: DAN_BACKEND_URL
  })

  const eoaAuth = new EOAAuth(eoaAddress, wallet, ephPK, 60 * 60)

  const threshold = 11
  const partiesNumber = 20

  const sdk = new NetworkSigner(wpClient, threshold, partiesNumber, eoaAuth)

  // Generate a new key
  const resp: KeygenResponse = await sdk.authenticateAndCreateKey(ephPK)

  const pubKey = resp.publicKey
  const mpcKeyId = resp.keyId as Hex

  const sessionKeyEOA = computeAddress(pubKey)

  return {
    sessionKeyEOA,
    mpcKeyId,
    ephSK,
    partiesNumber,
    threshold,
    eoaAddress
  }
}

export type DanSessionParamsPayload = {
  params: {
    sessionID: string
    danModuleInfo: DanModuleInfo
  }
}
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
  correspondingIndex: number | null | undefined
): Promise<DanSessionParamsPayload> => {
  const resumedSession = await resumeSession(conditionalSession)
  // if correspondingIndex is null then use the last session.
  const allSessions =
    await resumedSession.sessionStorageClient.getAllSessionData()

  const sessionID = didProvideFullSession(conditionalSession)
    ? (conditionalSession as Session).sessionIDInfo[correspondingIndex ?? 0]
    : allSessions[correspondingIndex ?? allSessions.length - 1].sessionID

  const matchingLeafDatum = allSessions.find((s) => s.sessionID === sessionID)

  if (!sessionID) throw new Error(ERROR_MESSAGES.MISSING_SESSION_ID)
  if (!matchingLeafDatum) throw new Error(ERROR_MESSAGES.NO_LEAF_FOUND)
  if (!matchingLeafDatum.danModuleInfo)
    throw new Error(ERROR_MESSAGES.NO_DAN_MODULE_INFO)
  const chainIdsMatch = chain.id === matchingLeafDatum?.danModuleInfo?.chainId
  if (!chainIdsMatch) throw new Error(ERROR_MESSAGES.CHAIN_ID_MISMATCH)

  return {
    params: {
      sessionID,
      danModuleInfo: matchingLeafDatum.danModuleInfo
    }
  }
}
