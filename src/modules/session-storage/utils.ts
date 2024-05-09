import type { Chain, Hex } from "viem"
import { SessionFileStorage, SessionLocalStorage } from "../.."
import type { BiconomySmartAccountV2, SmartAccountSigner } from "../../account"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import { supportsLocalStorage } from "./SessionLocalStorage"

export type SessionStoragePayload = {
  sessionKeyAddress: Hex
  signer: SmartAccountSigner
  sessionStorageClient: ISessionStorage
}

/**
 * createAndStoreNewSessionKey
 *
 * This function is used to store a new session key in the session storage.
 * If the session storage client is not provided as the third argument, it will create a new session storage client based on the environment.
 * When localStorage is supported, it will return SessionLocalStorage, otherwise it will assume you are in a backend and use SessionFileStorage.
 *
 * @param smartAccount: BiconomySmartAccountV2
 * @param chain: Chain
 * @param _sessionStorageClient: ISessionStorage
 * @returns
 */
export const createAndStoreNewSessionKey = async (
  smartAccount: BiconomySmartAccountV2,
  chain: Chain,
  _sessionStorageClient?: ISessionStorage
): Promise<SessionStoragePayload> => {
  const userAccountAddress = await smartAccount.getAddress()
  const sessionStorageClient =
    _sessionStorageClient ??
    new (supportsLocalStorage ? SessionLocalStorage : SessionFileStorage)(
      userAccountAddress
    )
  const newSigner = await sessionStorageClient.addSigner(chain)
  const sessionKeyAddress = await newSigner.getAddress()
  return { sessionKeyAddress, signer: newSigner, sessionStorageClient }
}
