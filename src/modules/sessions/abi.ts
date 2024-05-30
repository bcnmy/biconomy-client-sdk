import {
  type AbiFunction,
  type ByteArray,
  type Chain,
  type Hex,
  concat,
  pad,
  slice,
  toFunctionSelector,
  toHex
} from "viem"
import type {
  CreateSessionDataParams,
  Permission,
  SessionParams,
  UserOpResponse
} from "../../"
import {
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES,
  Logger,
  type Transaction
} from "../../account"
import {
  createSessionKeyManagerModule,
  didProvideFullSession,
  resumeSession
} from "../index"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import {
  DEFAULT_ABI_SVM_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE
} from "../utils/Constants"
import type { SessionSearchParam } from "../utils/Helper"
import type { DeprecatedPermission, Rule } from "../utils/Helper"

export type SessionConfig = {
  usersAccountAddress: Hex
  smartAccount: BiconomySmartAccountV2
}

export type Session = {
  /** The storage client specific to the smartAccountAddress which stores the session keys */
  sessionStorageClient: ISessionStorage
  /** The relevant sessionID for the chosen session */
  sessionIDInfo: string[]
}

export type SessionEpoch = {
  /** The time at which the session is no longer valid */
  validUntil?: number
  /** The time at which the session becomes valid */
  validAfter?: number
}

export type Policy = {
  /** The address of the contract to be included in the policy */
  contractAddress: Hex
  /** The address of the sessionKey upon which the policy is to be imparted */
  sessionKeyAddress: Hex
  /** The specific function selector from the contract to be included in the policy */
  functionSelector: string | AbiFunction
  /** The rules  to be included in the policy */
  rules: Rule[]
  /** The time interval within which the session is valid. If left unset the session will remain invalid indefinitely */
  interval?: SessionEpoch
  /** The maximum value that can be transferred in a single transaction */
  valueLimit: bigint
}

export type SessionGrantedPayload = UserOpResponse & { session: Session }

/**
 *
 * createSession
 *
 * Creates a session for a user's smart account.
 * This grants a dapp permission to execute a specific function on a specific contract on behalf of a user.
 * Permissions can be specified by the dapp in the form of rules{@link Rule}, and then submitted to the user for approval via signing.
 * The session keys granted with the imparted policy are stored in a StorageClient {@link ISessionStorage}. They can later be retrieved and used to validate userops.
 *
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param sessionKeyAddress - The address of the sessionKey upon which the policy is to be imparted.
 * @param policy - An array of session configurations {@link Policy}.
 * @param sessionStorageClient - The storage client to store the session keys. {@link ISessionStorage}
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
 * const sessionStorage = new SessionFileStorage(smartAccountAddress)
 * const sessionKeyAddress = (await sessionStorage.addSigner(undefined, polygonAmoy)).getAddress();
 *
 * const { wait, sessionID } = await createSession(
 *    smartAccount,
 *    [
 *      {
 *        sessionKeyAddress,
 *        contractAddress: nftAddress,
 *        functionSelector: "safeMint(address)",
 *        rules: [
 *          {
 *            offset: 0,
 *            condition: 0,
 *            referenceValue: smartAccountAddress
 *          }
 *        ],
 *        interval: {
 *          validUntil: 0,
 *          validAfter: 0
 *         },
 *         valueLimit: 0n
 *      }
 *    ],
 *    sessionStorage,
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
 * console.log({ sessionID, success }); // Use the sessionID later to retrieve the sessionKey from the storage client
 * ```
 */
export const createSession = async (
  smartAccount: BiconomySmartAccountV2,
  policy: Policy[],
  sessionStorageClient: ISessionStorage,
  buildUseropDto?: BuildUserOpOptions
): Promise<SessionGrantedPayload> => {
  const smartAccountAddress = await smartAccount.getAddress()
  const sessionsModule = await createSessionKeyManagerModule({
    smartAccountAddress,
    sessionStorageClient
  })

  const { data: policyData, sessionIDInfo } =
    await sessionsModule.createSessionData(policy.map(createABISessionDatum))

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

  return {
    session: {
      sessionStorageClient,
      sessionIDInfo
    },
    ...userOpResponse
  }
}

export type HardcodedFunctionSelector = {
  raw: Hex
}

export type CreateSessionDatumParams = {
  interval?: SessionEpoch
  sessionKeyAddress: Hex
  contractAddress: Hex
  functionSelector: string | AbiFunction | HardcodedFunctionSelector
  rules: Rule[]
  valueLimit: bigint
}

/**
 *
 * createABISessionDatum
 *
 * Used to create a session datum for the ABI Session Validation Module.
 * It can also be used to create a session datum for batchSession mode.
 *
 * @param createSessionDataParams - {@link CreateSessionDatumParams}
 * @returns {@link CreateSessionDataParams}
 */
export const createABISessionDatum = ({
  /** The time interval within which the session is valid. If left unset the session will remain invalid indefinitely {@link SessionEpoch} */
  interval,
  /** The sessionKeyAddress upon which the policy is to be imparted. Used as a reference to the stored session keys */
  sessionKeyAddress,
  /** The address of the contract to be included in the policy */
  contractAddress,
  /** The specific function selector from the contract to be included in the policy */
  functionSelector,
  /** The rules to be included in the policy */
  rules,
  /** The maximum value that can be transferred in a single transaction */
  valueLimit
}: CreateSessionDatumParams): CreateSessionDataParams => {
  const { validUntil = 0, validAfter = 0 } = interval ?? {}

  let parsedFunctionSelector: Hex = "0x"

  const rawFunctionSelectorWasProvided = !!(
    functionSelector as HardcodedFunctionSelector
  )?.raw

  if (rawFunctionSelectorWasProvided) {
    parsedFunctionSelector = (functionSelector as HardcodedFunctionSelector).raw
  } else {
    const unparsedFunctionSelector = functionSelector as AbiFunction | string
    parsedFunctionSelector = slice(
      toFunctionSelector(unparsedFunctionSelector),
      0,
      4
    )
  }

  return {
    validUntil,
    validAfter,
    sessionValidationModule: DEFAULT_ABI_SVM_MODULE,
    sessionPublicKey: sessionKeyAddress,
    sessionKeyData: getSessionDatum(sessionKeyAddress, {
      destContract: contractAddress,
      functionSelector: parsedFunctionSelector,
      valueLimit,
      rules
    })
  }
}

/**
 * @deprecated
 */
export async function getABISVMSessionKeyData(
  sessionKey: `0x${string}` | Uint8Array,
  permission: DeprecatedPermission
): Promise<`0x${string}` | Uint8Array> {
  let sessionKeyData = concat([
    sessionKey,
    permission.destContract,
    permission.functionSelector,
    pad(toHex(permission.valueLimit), { size: 16 }),
    pad(toHex(permission.rules.length), { size: 2 }) // this can't be more 2**11 (see below), so uint16 (2 bytes) is enough
  ]) as `0x${string}`

  for (let i = 0; i < permission.rules.length; i++) {
    sessionKeyData = concat([
      sessionKeyData,
      pad(toHex(permission.rules[i].offset), { size: 2 }), // offset is uint16, so there can't be more than 2**16/32 args = 2**11
      pad(toHex(permission.rules[i].condition), { size: 1 }), // uint8
      permission.rules[i].referenceValue
    ])
  }
  return sessionKeyData
}

export function getSessionDatum(
  sessionKeyAddress: Hex,
  permission: Permission
): Hex {
  let sessionKeyData = concat([
    sessionKeyAddress,
    permission.destContract,
    permission.functionSelector,
    pad(toHex(permission.valueLimit), { size: 16 }),
    pad(toHex(permission.rules.length), { size: 2 }) // this can't be more 2**11 (see below), so uint16 (2 bytes) is enough
  ]) as Hex

  for (let i = 0; i < permission.rules.length; i++) {
    sessionKeyData = concat([
      sessionKeyData,
      pad(toHex(permission.rules[i].offset), { size: 2 }), // offset is uint16, so there can't be more than 2**16/32 args = 2**11
      pad(toHex(permission.rules[i].condition), { size: 1 }), // uint8
      parseReferenceValue(permission.rules[i].referenceValue)
    ]) as Hex
  }

  return sessionKeyData
}

export type HardcodedReference = {
  raw: Hex
}
type BaseReferenceValue = string | number | bigint | boolean | ByteArray
type AnyReferenceValue = BaseReferenceValue | HardcodedReference

/**
 *
 * parseReferenceValue
 *
 * Parses the reference value to a hex string.
 * The reference value can be hardcoded using the {@link HardcodedReference} type.
 * Otherwise, it can be a string, number, bigint, boolean, or ByteArray.
 *
 * @param referenceValue {@link AnyReferenceValue}
 * @returns Hex
 */
export function parseReferenceValue(referenceValue: AnyReferenceValue): Hex {
  try {
    if ((referenceValue as HardcodedReference)?.raw) {
      return (referenceValue as HardcodedReference)?.raw
    }
    if (typeof referenceValue === "bigint") {
      return pad(toHex(referenceValue), { size: 32 }) as Hex
    }
    return pad(referenceValue as Hex, { size: 32 })
  } catch (e) {
    return pad(referenceValue as Hex, { size: 32 })
  }
}

export type SingleSessionParamsPayload = {
  params: SessionParams
}
/**
 * getSingleSessionTxParams
 *
 * Retrieves the transaction parameters for a batched session.
 *
 * @param correspondingIndex - An index for the transaction corresponding to the relevant session. If not provided, the last session index is used.
 * @param conditionalSession - {@link SessionSearchParam} The session data that contains the sessionID and sessionSigner. If not provided, The default session storage (localStorage in browser, fileStorage in node backend) is used to fetch the sessionIDInfo
 * @param chain - The chain.
 * @returns Promise<{@link BatchSessionParamsPayload}> - session parameters.
 *
 */
export const getSingleSessionTxParams = async (
  conditionalSession: SessionSearchParam,
  chain: Chain,
  correspondingIndex: number | null | undefined
): Promise<SingleSessionParamsPayload> => {
  const { sessionStorageClient } = await resumeSession(conditionalSession)

  // if correspondingIndex is null then use the last session.
  const allSessions = await sessionStorageClient.getAllSessionData()
  const sessionID = didProvideFullSession(conditionalSession)
    ? (conditionalSession as Session).sessionIDInfo[correspondingIndex ?? 0]
    : allSessions[correspondingIndex ?? allSessions.length - 1].sessionID

  const sessionSigner = await sessionStorageClient.getSignerBySession(
    {
      sessionID
    },
    chain
  )

  return {
    params: {
      sessionSigner,
      sessionID
    }
  }
}
