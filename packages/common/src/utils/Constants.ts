import { SupportedSignerName } from "./Types";

export const UNIQUE_PROPERTIES_PER_SIGNER: Record<SupportedSignerName, string> = {
  alchemy: "signerType",
  ethers: "provider",
  viem: "transport",
};
