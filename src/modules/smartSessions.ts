import { type Address, type Hex, encodeAbiParameters, isHex } from "viem"
import { UniActionPolicyAbi } from "../__contracts/abi"
import { ERROR_MESSAGES } from "../account"
import { type AnyReferenceValue, parseReferenceValue } from "./utils/Helper"

export type ActionConfig = {
  valueLimitPerUse: bigint
  paramRules: {
    length: number
    rules: {
      condition: ParamCondition
      offsetIndex: number
      isLimited: boolean
      ref: AnyReferenceValue
      usage: LimitUsage
    }[]
  }
}

export const toActionConfig = (config: ActionConfig): RawActionConfig => ({
  valueLimitPerUse: BigInt(config.valueLimitPerUse),
  paramRules: {
    length: BigInt(config.paramRules.length),
    rules: config.paramRules.rules.map((rule) => {
      const parsedRef = parseReferenceValue(rule.ref)
      if (isHex(parsedRef) && parsedRef.length !== 66) {
        throw new Error(ERROR_MESSAGES.INVALID_HEX)
      }
      return {
        condition: rule.condition,
        offset: BigInt(rule.offsetIndex) * BigInt(32),
        isLimited: rule.isLimited,
        ref: parsedRef,
        usage: rule.usage
      }
    })
  }
})

export type RawActionConfig = {
  valueLimitPerUse: bigint
  paramRules: RawParamRules
}

export type RawParamRules = {
  length: bigint
  rules: RawParamRule[]
}

export type RawParamRule = {
  condition: ParamCondition
  offset: bigint
  isLimited: boolean
  ref: Hex
  usage: LimitUsage
}

export type LimitUsage = {
  limit: bigint
  used: bigint
}

export enum ParamCondition {
  EQUAL = 0,
  GREATER_THAN = 1,
  LESS_THAN = 2,
  GREATER_THAN_OR_EQUAL = 3,
  LESS_THAN_OR_EQUAL = 4,
  NOT_EQUAL = 5
}

export type Policy = {
  address: Hex
  initData: Hex
  deInitData: Hex
}

export type Params = {
  token: Address
  limit: bigint
}[]

export const MAX_RULES = 16

export const toUniversalActionPolicy = (
  actionConfig: ActionConfig
): Policy => ({
  address: "0x28120dC008C36d95DE5fa0603526f219c1Ba80f6",
  initData: encodeAbiParameters(UniActionPolicyAbi, [
    toActionConfig(actionConfig)
  ]),
  deInitData: "0x"
})

export const sudoPolicy: Policy = {
  address: "0x",
  initData: "0x",
  deInitData: "0x"
}

export const toSpendingLimitsPolicy = (params: Params): Policy => {
  return {
    address: "0xDe9688b24c00699Ad51961ef90Ce5a9a8C49982B",
    initData: encodeAbiParameters(
      [{ type: "address[]" }, { type: "uint256[]" }],
      [params.map(({ token }) => token), params.map(({ limit }) => limit)]
    ),
    deInitData: "0x"
  }
}

export const policies = {
  to: {
    universalAction: toUniversalActionPolicy,
    spendingLimits: toSpendingLimitsPolicy
  },
  sudo: sudoPolicy
} as const

export default policies
