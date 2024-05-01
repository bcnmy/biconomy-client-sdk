import {
  parseEther,
  slice,
  toFunctionSelector,
  type Hex,
  type AbiFunction,
  createWalletClient,
  http,
  concat,
  toHex,
  pad
} from "viem"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import { createSessionKeyManagerModule } from ".."
import {
  DEFAULT_ABI_SVM_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE
} from "../utils/Constants"
import { type Rule } from "../utils/Helper"
import { getRandomSignerForChain } from "../../../tests/utils"
import {
  createSmartAccountClient,
  getChain,
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  type BuildUserOpOptions,
  type Transaction
} from "../../account"
import type { ModuleInfo, Permission, SignerData, UserOpResponse } from "../.."
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

export type SessionData = {
  sessionStorageClient: ISessionStorage
  sessionID: string
}

export type SessionConfig = {
  usersAccountAddress: Hex
  usersSmartAccount: BiconomySmartAccountV2
}

export type SessionEpoch = {
  validUntil?: number
  validAfter?: number
}

export type StartSessionConfig = {
  sessionStorageClient: ISessionStorage
  chainId: number
  contractAddress: Hex
  functionSelector: string | AbiFunction
  rules: Rule[]
  interval?: SessionEpoch
}

export const startSession = async (
  usersSmartAccount: BiconomySmartAccountV2,
  {
    chainId,
    contractAddress,
    functionSelector,
    rules,
    interval,
    sessionStorageClient
  }: StartSessionConfig,
  buildUseropDto?: BuildUserOpOptions
): Promise<{ userOpResponse: UserOpResponse; sessionID: string }> => {
  const { validUntil = 0, validAfter = 0 } = interval || {}
  const randomlyGeneratedSessionKeys = getRandomSignerForChain(chainId)
  await sessionStorageClient.addSigner(randomlyGeneratedSessionKeys)
  const userAccountAddress = await usersSmartAccount.getAddress()

  const sessionsModule = await createSessionKeyManagerModule({
    smartAccountAddress: userAccountAddress,
    sessionStorageClient
  })

  const { data: policyData } = await sessionsModule.createSessionData([
    {
      validUntil,
      validAfter,
      sessionValidationModule: DEFAULT_ABI_SVM_MODULE,
      sessionPublicKey: randomlyGeneratedSessionKeys.address,
      sessionKeyData: await getABISVMSessionKeyData(
        randomlyGeneratedSessionKeys.address,
        {
          destContract: contractAddress,
          functionSelector: slice(toFunctionSelector(functionSelector), 0, 4),
          valueLimit: parseEther("0"),
          rules
        }
      )
    }
  ])

  const setSessionAllowedTrx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData
  }

  const manyOrOneTxs: Transaction[] = []
  const isUsersSmartAccountEnabledForSessions =
    await usersSmartAccount.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE)

  if (!isUsersSmartAccountEnabledForSessions) {
    const enableModuleTrx = await usersSmartAccount.getEnableModuleData(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )
    manyOrOneTxs.push(enableModuleTrx)
  }
  manyOrOneTxs.push(setSessionAllowedTrx)

  const userOpResponse = await usersSmartAccount.sendTransaction(
    manyOrOneTxs,
    buildUseropDto
  )

  const sessionPublicKey = randomlyGeneratedSessionKeys.address

  const sessionID =
    (
      await sessionStorageClient.getSessionData({
        sessionPublicKey,
        sessionValidationModule: DEFAULT_ABI_SVM_MODULE
      })
    ).sessionID ?? ""

  return {
    sessionID,
    userOpResponse
  }
}

/** Returns a smartAccountClient */
export const createSessionSmartAccountClient = async (
  biconomySmartAccountConfig: Omit<BiconomySmartAccountV2Config, "signer"> & {
    accountAddress: Hex
    chainId: number
    bundlerUrl: string
  },
  { sessionStorageClient, sessionID }: SessionData
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

  const sessionSigner = await sessionStorageClient.getSignerBySession({
    sessionID
  })

  const moduleInfo: ModuleInfo = {
    sessionID,
    sessionSigner
  }

  const sessionModule = await createSessionKeyManagerModule({
    smartAccountAddress: biconomySmartAccountConfig.accountAddress,
    sessionStorageClient
  })

  return await createSmartAccountClient({
    ...biconomySmartAccountConfig,
    signer: incompatibleSigner, // This is a dummy signer, it will remain unused
    activeValidationModule: sessionModule,
    moduleInfo // contains the sessionSigner that will be used
  })
}

export async function getABISVMSessionKeyData(
  sessionKey: Hex,
  permission: Permission
): Promise<Hex> {
  let sessionKeyData = concat([
    sessionKey,
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
      permission.rules[i].referenceValue
    ]) as Hex
  }
  return sessionKeyData
}
