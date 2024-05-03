import {
  type AbiFunction,
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
  UserOpResponse
} from "../../"
import {
  type BiconomySmartAccountV2,
  type BuildUserOpOptions,
  ERROR_MESSAGES,
  type Transaction
} from "../../account"
import { createSessionKeyManagerModule } from "../index"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import {
  DEFAULT_ABI_SVM_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE
} from "../utils/Constants"
import type { Rule } from "../utils/Helper"

export type SessionData = {
  sessionStorageClient: ISessionStorage
  sessionID: string
}

export type SessionConfig = {
  usersAccountAddress: Hex
  smartAccount: BiconomySmartAccountV2
}

export type SessionEpoch = {
  validUntil?: number
  validAfter?: number
}

export type CreateSessionConfig = {
  contractAddress: Hex
  sessionKeyAddress: Hex
  functionSelector: string | AbiFunction
  rules: Rule[]
  interval?: SessionEpoch
  valueLimit: bigint
}

/**
 * Creates a "ABI" session for a user's smart account.
 * Permission can be specified by the dapp in the form of rules.
 * The rules are requested by the dapp and granted when the smartAccount signer signs the transaction.
 * The session keys are stored in a storageClient.
 *
 * */
export const createSession = async (
  smartAccount: BiconomySmartAccountV2,
  sessionKeyAddress: Hex,
  sessionConfigs: CreateSessionConfig[],
  sessionStorageClient: ISessionStorage,
  buildUseropDto?: BuildUserOpOptions
): Promise<UserOpResponse & { sessionID: string }> => {
  const userAccountAddress = await smartAccount.getAddress()

  const sessionsModule = await createSessionKeyManagerModule({
    smartAccountAddress: userAccountAddress,
    sessionStorageClient
  })

  const { data: policyData } = await sessionsModule.createSessionData(
    sessionConfigs.map(createABISessionDatum)
  )

  const permitTx = {
    to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
    data: policyData
  }

  const txs: Transaction[] = []

  const isDeployed = await smartAccount.isAccountDeployed()
  if (!isDeployed) throw new Error(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED)

  const enabled = await smartAccount.isModuleEnabled(
    DEFAULT_SESSION_KEY_MANAGER_MODULE
  )

  if (!enabled) {
    txs.push(
      await smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE)
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

export type CreateSessionDatumParams = {
  interval?: SessionEpoch
  sessionKeyAddress: Hex
  contractAddress: Hex
  functionSelector: string | AbiFunction
  rules: Rule[]
  valueLimit: bigint
}

export const createABISessionDatum = ({
  interval,
  sessionKeyAddress,
  contractAddress,
  functionSelector,
  rules,
  valueLimit
}: CreateSessionDatumParams): CreateSessionDataParams => {
  const { validUntil = 0, validAfter = 0 } = interval ?? {}
  return {
    validUntil,
    validAfter,
    sessionValidationModule: DEFAULT_ABI_SVM_MODULE,
    sessionPublicKey: sessionKeyAddress,
    sessionKeyData: getABISVMSessionKeyData(sessionKeyAddress, {
      destContract: contractAddress,
      functionSelector: slice(toFunctionSelector(functionSelector), 0, 4),
      valueLimit,
      rules
    })
  }
}

export function getABISVMSessionKeyData(
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
      permission.rules[i].referenceValue
    ]) as Hex
  }
  return sessionKeyData
}
