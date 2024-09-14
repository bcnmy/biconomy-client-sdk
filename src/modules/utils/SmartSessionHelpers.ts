import { type Address, type Hex, type PublicClient, encodeAbiParameters, encodePacked } from "viem"
import { UniActionPolicyAbi } from "../../__contracts/abi"
import { type AnyReferenceValue, parseReferenceValue } from "./Helper"
import { type EnableSessionData, type Session, SmartSessionMode, type SmartSessionModeType } from "./Types"
import { LibZip } from 'solady'
import { smartSessionAbi, encodeEnableSessionSignatureAbi, universalActionPolicyAbi } from "./abi"
import { TEST_CONTRACTS } from "../../../tests/src/callDatas.js"

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

export const formatPermissionEnableSig = ({
    signature,
    validator,
  }: {
    signature: Hex
    validator: Address
  }) => {
      return encodePacked(['address', 'bytes'], [validator, signature])
  }

  export const getPermissionId = async ({
    client,
    session,
  }: {
    client: PublicClient
    session: Session
  }) => {
    // Review address population
    return (await client.readContract({
      address: TEST_CONTRACTS.SmartSession.address, // Review address import
      abi: smartSessionAbi,
      functionName: 'getPermissionId',
      args: [session],
    })) as string
  }

export const encodeEnableSessionSignature = ({
    enableSessionData,
    signature,
  }: {
    enableSessionData: EnableSessionData
    signature: Hex
  }) => {
    return encodeAbiParameters(encodeEnableSessionSignatureAbi, [
      {
        chainDigestIndex: enableSessionData.enableSession.chainDigestIndex,
        hashesAndChainIds: enableSessionData.enableSession.hashesAndChainIds,
        sessionToEnable: enableSessionData.enableSession.sessionToEnable,
        permissionEnableSig: formatPermissionEnableSig({
          signature: enableSessionData.enableSession.permissionEnableSig,
          validator: enableSessionData.validator,
        }),
      },
      signature,
    ])
  }

export const encodeSmartSessionSignature = ({
    mode,
    permissionId,
    signature,
    enableSessionData,
  }: {
    mode: SmartSessionModeType
    permissionId: Hex
    signature: Hex
    enableSessionData?: EnableSessionData
  }) => {
    switch (mode) {
      case SmartSessionMode.USE:
        return encodePacked(
          ['bytes1', 'bytes32', 'bytes'],
          [
            mode,
            permissionId,
            LibZip.flzCompress(
              encodeAbiParameters(
                [
                  {
                    type: 'bytes',
                  },
                ],
                [signature],
              ),
            ) as Hex,
          ],
        )
      case SmartSessionMode.ENABLE:
      case SmartSessionMode.UNSAFE_ENABLE:
        if (!enableSessionData) {
          throw new Error('enableSession is required for ENABLE mode')
        }
  
        return encodePacked(
          ['bytes1', 'bytes32', 'bytes'],
          [
            mode,
            permissionId,
            LibZip.flzCompress(
              encodeEnableSessionSignature({ enableSessionData, signature }),
            ) as Hex,
          ],
        )
      default:
        throw new Error(`Unknown mode ${mode}`)
    }
  }

  // Note: this helper gives you policy data for a universal action policy
  // PolicyData is a struct that contains the policy address and the init data
  // Action config requires param rules. we should have a way to build rules next
  export const getUniversalActionPolicy = (
    actionConfig: ActionConfig,
  ): Policy => {
    if (actionConfig.paramRules.rules.length > MAX_RULES) {
      throw new Error(`Max number of rules is ${MAX_RULES}`)
    }
  
    // Review address population
    return {
      address: TEST_CONTRACTS.UniActionPolicy.address,
      initData: encodeAbiParameters(universalActionPolicyAbi, [
        {
          valueLimitPerUse: actionConfig.valueLimitPerUse,
          paramRules: {
            length: actionConfig.paramRules.length,
            rules: actionConfig.paramRules.rules,
          },
        },
      ]),
      deInitData: '0x',
    }
  }
