import type { Hex } from "viem"
export const addresses: Record<string, Hex> = {
  Nexus: "0x2ecd86799137FA35De834Da03D876bcc363ec0c3",
  K1Validator: "0xBD654f9F8718840591A2964E2f0cA5b0bB743183",
  K1ValidatorFactory: "0xB0D70f13903f3Eb5D378dD6A5aC4E755Fc13dC1b",
  UniActionPolicy: "0x28120dC008C36d95DE5fa0603526f219c1Ba80f6"
} as const
export default addresses