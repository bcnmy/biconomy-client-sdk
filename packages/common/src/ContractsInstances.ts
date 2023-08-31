import { SmartAccountType } from '@biconomy/core-types';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
  EntryPoint_v100,
  EntryPoint_v100__factory,
  SmartAccount_v100,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100__factory
} from './typechain';

export type GetContractInstanceDto = {
  smartAccountType: SmartAccountType;
  version: string;
  contractAddress: string;
  provider: JsonRpcProvider;
};

export function getSAProxyContract(contractInstanceDto: GetContractInstanceDto): SmartAccount_v100 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto;
  switch (version) {
    case 'V1_0_0':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccount_v100__factory.connect(contractAddress, provider);
      }
      break;
    default:
      return SmartAccount_v100__factory.connect(contractAddress, provider);
  }
  throw new Error('Invalid version or smartAccountType provided for proxy contract instance');
}

export function getSAFactoryContract(
  contractInstanceDto: GetContractInstanceDto
): SmartAccountFactory_v100 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto;

  switch (version) {
    case 'V1_0_0':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccountFactory_v100__factory.connect(contractAddress, provider);
      }
      break;
    default:
      return SmartAccountFactory_v100__factory.connect(contractAddress, provider);
  }
  throw new Error('Invalid version or smartAccountType provided for factory contract instance');
}

export function getEntryPointContract(
  contractInstanceDto: GetContractInstanceDto
): EntryPoint_v100 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto;

  switch (version) {
    case 'V0_0_5':
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return EntryPoint_v100__factory.connect(contractAddress, provider);
      }
      break;
    default:
      return EntryPoint_v100__factory.connect(contractAddress, provider);
  }
  throw new Error('Invalid version or smartAccountType provided for entrypoint contract instance');
}
