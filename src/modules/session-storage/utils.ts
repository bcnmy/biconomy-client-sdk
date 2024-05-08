import type { Chain, Hex } from "viem"
import {
  type BiconomySmartAccountV2,
  type SmartAccountSigner,
} from "../../account"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import { SessionFileStorage,  SessionMemoryStorage, SessionLocalStorage } from "../.."

export const createAndStoreNewSessionKey = async (
  smartAccount: BiconomySmartAccountV2,
  chain: Chain,
  _sessionStorageClient?: ISessionStorage,
): Promise<{ sessionKeyAddress: Hex; signer: SmartAccountSigner, sessionStorageClient: ISessionStorage }> => {
  const hasWindow = typeof window !== 'undefined';
  const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined';
  const userAccountAddress = await smartAccount.getAddress();
  const sessionStorageClient = _sessionStorageClient ?? new (hasLocalStorage ? SessionLocalStorage: SessionFileStorage)(userAccountAddress);
  const newSigner = await sessionStorageClient.addSigner(chain)
  const sessionKeyAddress = await newSigner.getAddress()
  return { sessionKeyAddress, signer: newSigner, sessionStorageClient }
}
