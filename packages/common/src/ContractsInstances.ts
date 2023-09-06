import { SmartAccountType } from '@biconomy-devx/core-types'
import { JsonRpcProvider } from '@ethersproject/providers'
import { EntryPoint, IEntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import {
  EntryPoint_v005__factory,
  EntryPoint_v006__factory,
  SmartAccount_v100,
  SmartAccount_v200,
  SmartAccountFactory_v100,
  SmartAccountFactory_v200,
  SmartAccountFactory_v100__factory,
  SmartAccountFactory_v200__factory,
  SmartAccount_v100__factory,
  SmartAccount_v200__factory
} from './typechain'

export type GetContractInstanceDto = {
  smartAccountType: SmartAccountType
  version: string
  contractAddress: string
  provider: JsonRpcProvider
}

// TODO // Review return types
export function getSAProxyContract(
  contractInstanceDto: GetContractInstanceDto
): SmartAccount_v100 | SmartAccount_v200 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto
  switch (version) {
    case 'V1_0_0':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccount_v100__factory.connect(contractAddress, provider)
      }
      break
    case 'V2_0_0':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccount_v200__factory.connect(contractAddress, provider)
      }
      break
    default:
      return SmartAccount_v200__factory.connect(contractAddress, provider)
  }
  throw new Error('Invalid version or smartAccountType provided for proxy contract instance')
}

// TODO // Review return types
export function getSAFactoryContract(
  contractInstanceDto: GetContractInstanceDto
): SmartAccountFactory_v100 | SmartAccountFactory_v200 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto

  switch (version) {
    case 'V1_0_0':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccountFactory_v100__factory.connect(contractAddress, provider)
      }
      break
    case 'V2_0_0':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccountFactory_v200__factory.connect(contractAddress, provider)
      }
      break
    default:
      return SmartAccountFactory_v200__factory.connect(contractAddress, provider)
  }
  throw new Error('Invalid version or smartAccountType provided for factory contract instance')
}

export function getEntryPointContract(contractInstanceDto: GetContractInstanceDto): IEntryPoint {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto

  switch (version) {
    case 'V0_0_5':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return EntryPoint_v005__factory.connect(contractAddress, provider)
      }
      break
    case 'V0_0_6':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return EntryPoint_v006__factory.connect(contractAddress, provider)
      }
      break
    default:
      return EntryPoint_v006__factory.connect(contractAddress, provider)
  }
  throw new Error('Invalid version or smartAccountType provided for entrypoint contract instance')
}
