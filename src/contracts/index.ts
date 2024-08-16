import { K1ValidatorAbi, MockExecutorAbi } from "./abi"
import { EntrypointAbi } from "./abi/EntryPointABI"
import { K1ValidatorFactoryAbi } from "./abi/K1ValidatorFactoryAbi"
import { deployedContracts } from "./addresses"

export const ENTRYPOINT_SIMULATIONS =
  "0x74Cb5e4eE81b86e70f9045036a1C5477de69eE87"
export const ENTRYPOINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

const EntryPoint = {
  address: ENTRYPOINT_ADDRESS,
  abi: EntrypointAbi
} as const

const EntryPointSimulations = {
  address: ENTRYPOINT_SIMULATIONS
}

const K1ValidatorFactory = {
  address: deployedContracts.K1ValidatorFactory,
  abi: K1ValidatorFactoryAbi
}

const MockExecutor = {
  address: deployedContracts.MockExecutor,
  abi: MockExecutorAbi
}

const K1Validator = {
  address: deployedContracts.K1Validator,
  abi: K1ValidatorAbi
}

export const contracts = {
  EntryPoint,
  EntryPointSimulations,
  K1ValidatorFactory,
  MockExecutor,
  K1Validator
} as const

export default contracts
