import type { Hex } from "viem"
export const addresses: Record<string, Hex> = {
  Nexus: "0x21f4C007C9f091B93B7C1C6911E13ACcd3DAd403",
  K1Validator: "0x6854688d3D9A87a33Addd5f4deB5cea1B97fa5b7",
  K1ValidatorFactory: "0x976869CF9c5Dd5046b41963EF1bBcE62b5366869",
  UniActionPolicy: "0x28120dC008C36d95DE5fa0603526f219c1Ba80f6"
} as const
export default addresses