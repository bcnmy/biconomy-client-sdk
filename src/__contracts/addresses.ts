import type { Hex } from "viem"
export const addresses: Record<string, Hex> = {
  Nexus: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  K1Validator: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  K1ValidatorFactory: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
} as const
export default addresses
