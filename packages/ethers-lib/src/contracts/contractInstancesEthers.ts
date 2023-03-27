import { SmartWalletContractV100__factory as SmartWalletContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContractV100__factory'

import { MultiSendContractV100__factory as MultiSendContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContractV100__factory'

import { MultiSendCallOnlyContractV100__factory as MultiSendCallOnlyContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContractV100__factory'

import { SmartWalletFactoryContractV100__factory as SmartWalletContractFactoryV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContractV100__factory'

import SmartWalletContractEthers_v1_0_0 from './SmartWallet/v1.0.0/SmartWalletContractEthers'

import MultiSendEthersContract_v1_0_0 from './MultiSend/v1.0.0/MultiSendEthersContract'

import MultiSendCallOnlyEthersContract_v1_0_0 from './MultiSendCallOnly/v1.0.0/MultiSendCallOnlyEthersContract'

import SmartWalletFacoryContractEthers_v1_0_0 from './SmartWalletFactory/v1.0.0/SmartWalletProxyFactoryEthersContract'

import { EntryPointContractV100__factory as EntryPointFactoryContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/EntryPointContractV100__factory'

import EntryPointEthersContract_v1_0_0 from './EntryPointContract/v1.0.0/EntryPointEthersContract'

import { FallbackGasTankContractV100__factory as FallbackGasTankContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/FallbackGasTankContractV100__factory'
import FallbackGasTankEthersContract_v1_0_0 from './FallbackGasTank/v1.0.0/FallbackGasTankEthersContract'

import { DefaultCallbackHandlerV100__factory as DefaultCallbackHandlerContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/DefaultCallbackHandlerV100__factory'
import DefaultCallbackHandlerEthersContract_v1_0_0 from './DefaultCallbackHandlerContract/v1.0.0/DefaultCallbackHandlerEthersContract'

import { JsonRpcProvider } from '@ethersproject/providers'
import { SmartAccountVersion } from '@biconomy/core-types'

export function getSmartWalletContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): SmartWalletContractEthers_v1_0_0 {
  let walletContract
  switch (smartAccountVersion) {
    case '1.0.0':
      walletContract = SmartWalletContractV100.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_0(walletContract)
    default:
      walletContract = SmartWalletContractV100.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_0(walletContract)
  }
}

// Review
export function getMultiSendContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): MultiSendEthersContract_v1_0_0 {
  let multiSendContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendContract = MultiSendContractV100.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_0(multiSendContract)
    default:
      multiSendContract = MultiSendContractV100.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_0(multiSendContract)
  }
}

export function getMultiSendCallOnlyContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): MultiSendCallOnlyEthersContract_v1_0_0 {
  let multiSendCallContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendCallContract = MultiSendCallOnlyContractV100.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_0(multiSendCallContract)
    default:
      multiSendCallContract = MultiSendCallOnlyContractV100.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_0(multiSendCallContract)
  }
}

export function getSmartWalletFactoryContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
): SmartWalletFacoryContractEthers_v1_0_0 {
  let walletFactoryContract

  switch (smartAccountVersion) {
    case '1.0.0':
      walletFactoryContract = SmartWalletContractFactoryV100.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_0(walletFactoryContract)
    default:
      walletFactoryContract = SmartWalletContractFactoryV100.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_0(walletFactoryContract)
  }
}

export function getEntryPointFactoryContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
): EntryPointEthersContract_v1_0_0 {
  let walletFactoryContract

  switch (smartAccountVersion) {
    case '1.0.0':
      walletFactoryContract = EntryPointFactoryContractV100.connect(contractAddress, provider)
      return new EntryPointEthersContract_v1_0_0(walletFactoryContract)
    default:
      walletFactoryContract = EntryPointFactoryContractV100.connect(contractAddress, provider)
      return new EntryPointEthersContract_v1_0_0(walletFactoryContract)
  }
}

export function getFallbackGasTankContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
): FallbackGasTankEthersContract_v1_0_0 {
  let fallbackGasTankContract

  switch (smartAccountVersion) {
    case '1.0.0':
      fallbackGasTankContract = FallbackGasTankContractV100.connect(contractAddress, provider)
      return new FallbackGasTankEthersContract_v1_0_0(fallbackGasTankContract)
    case '1.0.1':
    default:
      fallbackGasTankContract = FallbackGasTankContractV100.connect(contractAddress, provider)
      return new FallbackGasTankEthersContract_v1_0_0(fallbackGasTankContract)
  }
}

export function getDefaultCallbackHandlerInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
): DefaultCallbackHandlerEthersContract_v1_0_0 {
  let defaultCallbackHandlerContract

  switch (smartAccountVersion) {
    case '1.0.0':
      defaultCallbackHandlerContract = DefaultCallbackHandlerContractV100.connect(
        contractAddress,
        provider
      )
      return new DefaultCallbackHandlerEthersContract_v1_0_0(defaultCallbackHandlerContract)
    default:
      defaultCallbackHandlerContract = DefaultCallbackHandlerContractV100.connect(
        contractAddress,
        provider
      )
      return new DefaultCallbackHandlerEthersContract_v1_0_0(defaultCallbackHandlerContract)
  }
}
