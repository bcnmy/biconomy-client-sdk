import { http, type Hex, createWalletClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import {
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule
} from ".."
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  createSmartAccountClient,
  getChain
} from "../../account"
import type { ModuleInfo } from "../utils/Types"
import type { SessionData } from "./abi"

export const createSessionSmartAccountClient = async (
  biconomySmartAccountConfig: Omit<BiconomySmartAccountV2Config, "signer"> & {
    accountAddress: Hex
    chainId: number
    bundlerUrl: string
  },
  { sessionStorageClient, sessionID }: SessionData,
  forBatch = false
): Promise<BiconomySmartAccountV2> => {
  const account = privateKeyToAccount(generatePrivateKey())

  const chain =
    biconomySmartAccountConfig.viemChain ??
    getChain(biconomySmartAccountConfig.chainId)

  const incompatibleSigner = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const sessionSigner = await sessionStorageClient.getSignerBySession(chain, {
    sessionID
  })

  const sessionData: ModuleInfo | undefined = forBatch
    ? undefined
    : {
        sessionID,
        sessionSigner
      }

  const sessionModule = await createSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient
  })

  const batchedSessionModule = await createBatchedSessionRouterModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionKeyManagerModule: sessionModule
  })

  return await createSmartAccountClient({
    ...biconomySmartAccountConfig,
    signer: incompatibleSigner, // This is a dummy signer, it will remain unused
    activeValidationModule: forBatch ? batchedSessionModule : sessionModule,
    sessionData // contains the sessionSigner that will be used for txs
  })
}
