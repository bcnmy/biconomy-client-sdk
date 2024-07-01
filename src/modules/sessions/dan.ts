import * as ed from "@noble/ed25519"
import {
  EOAAuth,
  type KeygenResponse,
  NetworkSigner,
  WalletProviderServiceClient
} from "@silencelaboratories/walletprovider-sdk"
import {
  http,
  type Chain,
  type EIP1193Provider,
  type HttpTransport,
  WalletClient,
  keccak256
} from "viem"
import { getHttpRpcClient } from "viem/utils"
import {
  type BiconomySmartAccountV2,
  ERROR_MESSAGES,
  type Hex,
  Logger,
  type Policy,
  type SessionGrantedPayload,
  type Transaction
} from "../../../src"
import type { BuildUserOpOptions } from "../../account"
import { DANSessionKeyManagerModule } from "../DANSessionKeyManagerModule"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import { inBrowser } from "../session-storage/SessionLocalStorage"
import { DEFAULT_SESSION_KEY_MANAGER_MODULE } from "../utils/Constants"
import { NodeWallet, hexToUint8Array } from "../utils/Helper"
import { BrowserWallet } from "../utils/Helper"
import { createABISessionDatum } from "./abi"
/**
 *
 * createDecentralisedSession
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
 * import { SessionFileStorage } from "@biconomy/session-file-storage";
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
 * const { wait, sessionID } = await createDANSession(
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

export type PolicyWithoutSessionKey = Omit<Policy, "sessionKeyAddress">

export const createDecentralisedSession = async (
  smartAccount: BiconomySmartAccountV2,
  chain: Chain,
  _policy: PolicyWithoutSessionKey[],
  sessionStorageClient: ISessionStorage,
  buildUseropDto?: BuildUserOpOptions
): Promise<SessionGrantedPayload> => {
  const smartAccountAddress = await smartAccount.getAddress()
  const sessionsModule = await DANSessionKeyManagerModule.create({
    smartAccountAddress,
    sessionStorageClient
  })

  const { sessionKeyEOA: sessionKeyAddress, mpcKeyId } =
    await getDANSessionKey(smartAccount)

  const policy: Policy[] = _policy.map((p) => ({
    ...p,
    sessionKeyAddress
  }))

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
      sessionIDInfo,
      keyId
    },
    ...userOpResponse
  }
}

export const getDANSessionKey = async (
  smartAccount: BiconomySmartAccountV2
) => {
  if (!process.env.EPHEMERAL_KEY)
    throw new Error("EPHEMERAL_KEY not found in environment variables")

  const eoaAddress = await smartAccount.getSigner().getAddress() // Smart account owner
  const wallet = new NodeWallet(smartAccount.getSigner().inner)

  const ephSK: Uint8Array = hexToUint8Array(process.env.EPHEMERAL_KEY)
  const ephPK: Uint8Array = await ed.getPublicKeyAsync(ephSK)

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl: "ws://localhost:8090/v1"
  })

  const eoaAuth = new EOAAuth(eoaAddress, wallet, ephPK, 60 * 60)

  const threshold = 11
  const partiesNumber = 20

  const sdk = new NetworkSigner(wpClient, threshold, partiesNumber, eoaAuth)

  // Generate a new key
  const resp: KeygenResponse = await sdk.authenticateAndCreateKey(ephPK)

  const pubKey = resp.publicKey
  const mpcKeyId = resp.keyId as Hex

  console.log({ resp })

  // Compute the Keccak-256 hash of the public key
  const hash = keccak256(`0x${pubKey}` as Hex)

  // The Ethereum address is the last 20 bytes of the hash
  const sessionKeyEOA = `0x${hash.slice(-40)}` as Hex

  return {
    sessionKeyEOA,
    mpcKeyId,
    ephSK,
    partiesNumber,
    threshold,
    eoaAddress
  }
}
