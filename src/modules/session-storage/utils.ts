import type { Chain, Hex } from "viem"
import { SessionFileStorage, SessionLocalStorage } from "../.."
import type { BiconomySmartAccountV2, SmartAccountSigner } from "../../account"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import { supportsLocalStorage } from "./SessionLocalStorage"

export const createAndStoreNewSessionKey = async (
  smartAccount: BiconomySmartAccountV2,
  chain: Chain,
  _sessionStorageClient?: ISessionStorage
): Promise<{
  sessionKeyAddress: Hex
  signer: SmartAccountSigner
  sessionStorageClient: ISessionStorage
}> => {
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
