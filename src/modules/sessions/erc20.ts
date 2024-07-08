import type { EncodeAbiParametersReturnType, Hex } from "viem";
import type { SessionEpoch } from "..";
import { DEFAULT_ERC20_MODULE } from "../utils/Constants";
import type { CreateSessionDataParams } from "../utils/Types";

export type CreateERC20SessionConfig = {
  interval: SessionEpoch;
  sessionKeyAddress: Hex;
  sessionKeyData: EncodeAbiParametersReturnType;
};
/**
 *
 * @param erc20SessionConfig {@link CreateERC20SessionConfig}
 * @returns {@link CreateSessionDataParams}
 */
export const createERC20SessionDatum = ({
  /** The time interval within which the session is valid. If left unset the session will remain invalid indefinitely {@link SessionEpoch} */
  interval,
  /** The sessionKeyAddress upon which the policy is to be imparted. Used as a reference to the stored session keys */
  sessionKeyAddress,
  /** The sessionKeyData to be included in the policy {@link EncodeAbiParametersReturnType}*/
  sessionKeyData,
}: CreateERC20SessionConfig): CreateSessionDataParams => {
  const { validUntil = 0, validAfter = 0 } = interval ?? {};
  return {
    validUntil,
    validAfter,
    sessionValidationModule: DEFAULT_ERC20_MODULE,
    sessionPublicKey: sessionKeyAddress,
    sessionKeyData,
  };
};
