import type { Hex } from "viem"
import { EntrypointAbi, K1ValidatorAbi, K1ValidatorFactoryAbi } from "./abi"
import addresses from "./addresses"

export const ENTRYPOINT_SIMULATIONS: Hex =
  "0x74Cb5e4eE81b86e70f9045036a1C5477de69eE87"
export const ENTRYPOINT_ADDRESS: Hex =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

const entryPoint = {
  address: ENTRYPOINT_ADDRESS,
  abi: EntrypointAbi
} as const

const entryPointSimulations = {
  address: ENTRYPOINT_SIMULATIONS
} as const

const k1ValidatorFactory = {
  address: addresses.K1ValidatorFactory,
  abi: K1ValidatorFactoryAbi
} as const

const k1Validator = {
  address: addresses.K1Validator,
  abi: K1ValidatorAbi
} as const

export const contracts = {
  entryPoint,
  entryPointSimulations,
  k1ValidatorFactory,
  k1Validator
} as const

export default contracts
