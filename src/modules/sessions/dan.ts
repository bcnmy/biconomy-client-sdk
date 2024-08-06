import type { Chain, Hex } from "viem"
import type {
  BiconomySmartAccountV2,
  BuildUserOpOptions,
} from "../../account"
import type { ISessionStorage } from "../interfaces/ISessionStorage"
import type { DanModuleInfo, IBrowserWallet } from "../utils/Types"
import type { Policy } from "./abi"

export type PolicyLeaf = Omit<Policy, "sessionKeyAddress">
export const DEFAULT_SESSION_DURATION = 60 * 60

export type CreateDistributedParams = {
  /** The user's smart account instance */
  smartAccountClient: BiconomySmartAccountV2,
  /** An array of session configurations */
  policy: PolicyLeaf[],
  /** The storage client to store the session keys */
  sessionStorageClient?: ISessionStorage,
  /** The build userop dto */
  buildUseropDto?: BuildUserOpOptions,
  /** The chain ID */
  chainId?: number,
  /** Optional. The user's {@link IBrowserWallet} instance. Default will be the signer associated with the smart account. */
  browserWallet?: IBrowserWallet
}

export type DanSessionKeyPayload = {
  /** Dan Session ephemeral key*/
  sessionKeyEOA: Hex;
  /** Dan Session MPC key ID*/
  mpcKeyId: string;
  /** Dan Session ephemeral private key without 0x prefi x*/
  hexEphSKWithout0x: string;
  /** Number of nodes that participate in keygen operation. Also known as n. */
  partiesNumber: number;
  /** Number of nodes that needs to participate in protocol in order to generate valid signature. Also known as t. */
  threshold: number;
  /** The eoa that was used to create the session */
  eoaAddress: Hex;
  /** the chainId is relevant only to the */
  chainId: number
}

export type DanSessionKeyRequestParams = {
  /**  Relevant smart account */
  smartAccountClient: BiconomySmartAccountV2;
  /** Optional browser wallet. If using wagmi can be set to connector.getProvider() from useAccount hook */
  browserWallet?: IBrowserWallet;
  /** Optional hardcoded values if required */
  hardcodedValues?: Partial<DanModuleInfo>;
  /** Optional duration of the session key in seconds. Default is 3600 seconds. */
  duration?: number;
  /** Optional chainId. Will be inferred if left unset. */
  chain?: Chain;
}

export type DanSessionParamsPayload = {
  params: {
    sessionID: string
  }
}
