import type { EncodeAbiParametersReturnType, Hex } from "viem"
import type { SessionEpoch } from ".."
import { DEFAULT_ERC20_MODULE } from "../utils/Constants"
import type { CreateSessionDataParams } from "../utils/Types"

export type CreateERC20SessionConfig = {
  interval: SessionEpoch
  sessionKeyAddress: Hex
  sessionKeyData: EncodeAbiParametersReturnType
}

export const createERC20SessionDatum = ({
  interval,
  sessionKeyAddress,
  sessionKeyData
}: CreateERC20SessionConfig): CreateSessionDataParams => {
  const { validUntil = 0, validAfter = 0 } = interval ?? {}
  return {
    validUntil,
    validAfter,
    sessionValidationModule: DEFAULT_ERC20_MODULE,
    sessionPublicKey: sessionKeyAddress,
    sessionKeyData
  }
}
