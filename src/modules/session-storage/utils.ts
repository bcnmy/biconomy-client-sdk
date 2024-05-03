import type { Hex } from "viem"
import {
  type SmartAccountSigner,
  type BiconomySmartAccountV2,
  getChain
} from "../../account"
import { extractChainIdFromBundlerUrl } from "../../bundler"
import type { ISessionStorage } from "../interfaces/ISessionStorage"

export const createAndStoreNewSessionKey = async (
  smartAccount: BiconomySmartAccountV2,
  sessionStorageClient: ISessionStorage
): Promise<{ sessionKeyAddress: Hex; signer: SmartAccountSigner }> => {
  const chainId = extractChainIdFromBundlerUrl(
    smartAccount.bundler?.getBundlerUrl() ?? ""
  )
  const chain = getChain(chainId)
  const newSigner = await sessionStorageClient.addSigner(chain)
  const sessionKeyAddress = await newSigner.getAddress()
  return { sessionKeyAddress, signer: newSigner }
}
