import type { Address, Chain, Hex } from "viem";
import type { BiconomySmartAccountV2, SmartAccountSigner } from "../../account";
import type { ISessionStorage } from "../interfaces/ISessionStorage";
import { supportsLocalStorage } from "./SessionLocalStorage";
import { SessionLocalStorage, SessionMemoryStorage } from "./index.js";

export type SessionStoragePayload = {
  sessionKeyAddress: Hex;
  signer: SmartAccountSigner;
  sessionStorageClient: ISessionStorage;
};

/**
 * createSessionKeyEOA
 *
 * This function is used to store a new session key in the session storage.
 * If the session storage client is not provided as the third argument, it will create a new session storage client based on the environment.
 * When localStorage is supported, it will return SessionLocalStorage, otherwise it will assume you are in a backend and use SessionMemoryStorage.
 *
 * @param smartAccount: BiconomySmartAccountV2
 * @param chain: Chain
 * @param _sessionStorageClient: ISessionStorage
 * @returns
 */
export const createSessionKeyEOA = async (
  smartAccount: BiconomySmartAccountV2,
  chain: Chain,
  _sessionStorageClient?: ISessionStorage,
): Promise<SessionStoragePayload> => {
  const userAccountAddress = await smartAccount.getAddress();
  const sessionStorageClient =
    _sessionStorageClient ?? getDefaultStorageClient(userAccountAddress);
  const newSigner = await sessionStorageClient.addSigner(undefined, chain);
  const sessionKeyAddress = await newSigner.getAddress();
  return { sessionKeyAddress, signer: newSigner, sessionStorageClient };
};

export const inTesting = (): boolean => {
  try {
    return process?.env?.TESTING?.toString() === "true";
  } catch (e) {
    return false;
  }
};

export const inNodeBackend = (): boolean => {
  try {
    return typeof process === "object" && process?.release?.name === "node";
  } catch (e) {
    return false;
  }
};

export const getDefaultStorageClient = (address: Address): ISessionStorage => {
  if (inTesting()) {
    return new SessionMemoryStorage(address);
  }
  if (supportsLocalStorage) {
    return new SessionLocalStorage(address);
  }
  if (inNodeBackend()) {
    return new SessionMemoryStorage(address); // Fallback to memory storage
  }
  throw new Error("No session storage client available");
};
