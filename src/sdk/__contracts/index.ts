import type { Hex } from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
import { EntrypointAbi, K1ValidatorAbi, K1ValidatorFactoryAbi } from "./abi"
import addresses from "./addresses"

export const ENTRYPOINT_SIMULATIONS: Hex =
  "0x74Cb5e4eE81b86e70f9045036a1C5477de69eE87"

const entryPoint = {
  address: entryPoint07Address,
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
