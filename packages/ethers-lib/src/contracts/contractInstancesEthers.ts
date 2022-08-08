import { SmartWalletContract__factory as SmartWalletContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContract__factory'
import { MultiSendContract__factory as MultiSendContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContract__factory'
import { MultiSendCallOnlyContract__factory as MultiSendCallOnlyContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContract__factory'
import { SmartWalletFactoryContract__factory as SmartWalletFactoryContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContract__factory'

import SmartWalletContractEthers_v1_0_0 from './SmartWallet/v1.0.0/SmartWalletContractEthers'
import SmartWalletContractEthers_v1_0_1 from './SmartWallet/v1.0.0/SmartWalletContractEthers'

import MultiSendEthersContract_v1_0_0 from './MultiSend/v1.0.0/MultiSendEthersContract'
import MultiSendEthersContract_v1_0_1 from './MultiSend/v1.0.1/MultiSendEthersContract'

import MultiSendCallOnlyEthersContract_v1_0_0 from './MultiSendCallOnly/v1.0.0/MultiSendCallOnlyEthersContract'
import MultiSendCallOnlyEthersContract_v1_0_1 from './MultiSendCallOnly/v1.0.1/MultiSendCallOnlyEthersContract'

import SmartWalletFacoryContractEthers_v1_0_0 from './SmartWalletFactory/v1.0.0/SmartWalletProxyFactoryEthersContract'
import SmartWalletFacoryContractEthers_v1_0_1 from './SmartWalletFactory/v1.0.1/SmartWalletProxyFactoryEthersContract'

import { JsonRpcProvider } from '@ethersproject/providers'
import { SmartAccountVersion } from '@biconomy-sdk/core-types'

export function getSmartWalletContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): SmartWalletContractEthers_v1_0_0 | SmartWalletContractEthers_v1_0_1 {
  let walletContract
  switch (smartAccountVersion) {
    case '1.0.0':
      walletContract = SmartWalletContract.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_0(walletContract)
    case '1.0.1':
      walletContract = SmartWalletContract.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_1(walletContract)
  }
}

// Review
export function getMultiSendContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): MultiSendEthersContract_v1_0_0 | MultiSendEthersContract_v1_0_1 {
  let multiSendContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendContract = MultiSendContract.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_0(multiSendContract)
    case '1.0.1':
      multiSendContract = MultiSendContract.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_1(multiSendContract)
  }
}

export function getMultiSendCallOnlyContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): MultiSendCallOnlyEthersContract_v1_0_0 | MultiSendCallOnlyEthersContract_v1_0_1 {
  let multiSendCallContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendCallContract = MultiSendCallOnlyContract.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_0(multiSendCallContract)
    case '1.0.1':
      multiSendCallContract = MultiSendCallOnlyContract.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_1(multiSendCallContract)
  }
}

export function getSmartWalletFactoryContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
): SmartWalletFacoryContractEthers_v1_0_0 | SmartWalletFacoryContractEthers_v1_0_1 {
  let walletFactoryContract

  switch (smartAccountVersion) {
    case '1.0.0':
      walletFactoryContract = SmartWalletFactoryContract.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_0(walletFactoryContract)
    case '1.0.1':
      walletFactoryContract = SmartWalletFactoryContract.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_1(walletFactoryContract)
  }
}
