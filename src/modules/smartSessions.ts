import { type Address, type Hex, encodeAbiParameters } from "viem"
import { UniActionPolicyAbi } from "../__contracts/abi"
import { type AnyReferenceValue, parseReferenceValue } from "./utils/Helper"

export type Rule = {
  /**
   * EQUAL = 0,
   * GREATER_THAN = 1,
   * LESS_THAN = 2,
   * GREATER_THAN_OR_EQUAL = 3,
   * LESS_THAN_OR_EQUAL = 4,
   * NOT_EQUAL = 5
   */
  condition: ParamCondition
  /**
   * The offset in the calldata where the value to be checked is located.
   * The offset is in multiples of 32 bytes. (Note: not the offsetIndex)
   * The offsetIndex is generally the index of the arg in the method that you wish to target.
   * The exception is when the arg is in an array
   * In this case, the offsetIndex needs to be figured out using its position in the array
   * (See the 'use-of-dynamic-types' example below for how to figure out the offsetIndex for an array)
   *
   * https://docs.soliditylang.org/en/develop/abi-spec.html#use-of-dynamic-types
   *
   * */
  offsetIndex: number
  /**
   * If the rule is limited, the usage object will contain the limit and the used values.
   */
  isLimited: boolean
  /**
   * The reference value to compare against. You can pass in the raw hex value or a human-friendly value.
   * Use the raw hex value if you are sure of the value you are passing in.
   */
  ref: AnyReferenceValue
  /**
   * The usage object will contain the limit and the used values, and is only required if the isLimited property is true.
   */
  usage: LimitUsage
}

export type ActionConfig = {
  valueLimitPerUse: bigint
  paramRules: {
    length: number
    rules: Rule[]
  }
}

export const toActionConfig = (config: ActionConfig): RawActionConfig => ({
  valueLimitPerUse: BigInt(config.valueLimitPerUse),
  paramRules: {
    length: BigInt(config.paramRules.length),
    rules: config.paramRules.rules.map((rule) => {
      const parsedRef = parseReferenceValue(rule.ref)
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
