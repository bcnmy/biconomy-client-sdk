import type { Hex } from "viem"
import {
  type CreateSessionDataParams,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_ABI_SVM_MODULE
} from ".."
import {
  type Transaction,
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES
} from "../../account"
import type { UserOpResponse } from "../../bundler"
import type { ISessionStorage } from "../interfaces/ISessionStorage"

export type CreateMultSessionConfig = {
  sessionStorageClient: ISessionStorage
  leaves: CreateSessionDataParams[]
}

export const createMultSession = async (
  smartAccount: BiconomySmartAccountV2,
  sessionKeyAddress: Hex,
  { sessionStorageClient, leaves }: CreateMultSessionConfig,
  buildUseropDto?: BuildUserOpOptions
): Promise<UserOpResponse & { sessionID: string }> => {
  const userAccountAddress = await smartAccount.getAddress()

  const sessionsModule = await createSessionKeyManagerModule({
    smartAccountAddress: userAccountAddress,
    sessionStorageClient
  })

  // Create batched session module
  const batchedSessionModule = await createBatchedSessionRouterModule({
    smartAccountAddress: userAccountAddress,
    sessionKeyManagerModule: sessionsModule
  })

  const { data: policyData } =
    await batchedSessionModule.createSessionData(leaves)

  const permitTx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData
  }

  const isDeployed = await smartAccount.isAccountDeployed()
  if (!isDeployed) throw new Error(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED)

  const txs: Transaction[] = []
  const [isSessionModuleEnabled, isBatchedSessionModuleEnabled] =
    await Promise.all([
      smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE),
      smartAccount.getEnableModuleData(DEFAULT_BATCHED_SESSION_ROUTER_MODULE)
    ])

  if (!isSessionModuleEnabled) {
    txs.push(
      await smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE)
    )
  }
  if (!isBatchedSessionModuleEnabled) {
    txs.push(
      await smartAccount.getEnableModuleData(
        DEFAULT_BATCHED_SESSION_ROUTER_MODULE
      )
    )
  }
  txs.push(permitTx)
  const userOpResponse = await smartAccount.sendTransaction(txs, buildUseropDto)

  const sessionID =
    (
      await sessionStorageClient.getSessionData({
        sessionPublicKey: sessionKeyAddress,
        sessionValidationModule: DEFAULT_ABI_SVM_MODULE
      })
    ).sessionID ?? ""

  return {
    sessionID,
    ...userOpResponse
  }
}
