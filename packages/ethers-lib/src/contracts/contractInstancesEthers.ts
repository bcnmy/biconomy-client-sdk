import { SmartWalletContractV100__factory as SmartWalletContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContractV100__factory'
import { SmartWalletContractV106__factory as SmartWalletContractV106 } from '../../typechain/src/ethers-v5/v1.0.6/factories/SmartWalletContractV106__factory'

import { MultiSendContractV100__factory as MultiSendContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContractV100__factory'
import { MultiSendContractV106__factory as MultiSendContractV106 } from '../../typechain/src/ethers-v5/v1.0.6/factories/MultiSendContractV106__factory'

import { MultiSendCallOnlyContractV100__factory as MultiSendCallOnlyContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContractV100__factory'
import { MultiSendCallOnlyContractV106__factory as MultiSendCallOnlyContractV106 } from '../../typechain/src/ethers-v5/v1.0.6/factories/MultiSendCallOnlyContractV106__factory'

import { SmartWalletFactoryContractV100__factory as SmartWalletFactoryContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContractV100__factory'
import { SmartWalletFactoryContractV106__factory as SmartWalletFactoryContractV106 } from '../../typechain/src/ethers-v5/v1.0.6/factories/SmartWalletFactoryContractV106__factory'

import SmartWalletContractEthers_v1_0_0 from './SmartWallet/v1.0.0/SmartWalletContractEthers'
import SmartWalletContractEthers_v1_0_6 from './SmartWallet/v1.0.6/SmartWalletContractEthers'

import MultiSendEthersContract_v1_0_0 from './MultiSend/v1.0.0/MultiSendEthersContract'
import MultiSendEthersContract_v1_0_6 from './MultiSend/v1.0.6/MultiSendEthersContract'

import MultiSendCallOnlyEthersContract_v1_0_0 from './MultiSendCallOnly/v1.0.0/MultiSendCallOnlyEthersContract'
import MultiSendCallOnlyEthersContract_v1_0_6 from './MultiSendCallOnly/v1.0.6/MultiSendCallOnlyEthersContract'

import SmartWalletFacoryContractEthers_v1_0_0 from './SmartWalletFactory/v1.0.0/SmartWalletProxyFactoryEthersContract'
import SmartWalletFacoryContractEthers_v1_0_6 from './SmartWalletFactory/v1.0.6/SmartWalletProxyFactoryEthersContract'

import { JsonRpcProvider } from '@ethersproject/providers'
import { SmartAccountVersion } from '@biconomy-sdk/core-types'

export function getSmartWalletContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
):
  | SmartWalletContractEthers_v1_0_0
  | SmartWalletContractEthers_v1_0_6 {
  let walletContract
  switch (smartAccountVersion) {
    case '1.0.0':
      walletContract = SmartWalletContractV100.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_0(walletContract)
    case '1.0.6':
      walletContract = SmartWalletContractV106.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_6(walletContract)
  }
}

// Review
export function getMultiSendContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
):
  | MultiSendEthersContract_v1_0_0
  | MultiSendEthersContract_v1_0_6 {
  let multiSendContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendContract = MultiSendContractV100.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_0(multiSendContract)
    case '1.0.6':
      multiSendContract = MultiSendContractV106.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_6(multiSendContract)
  }
}

export function getMultiSendCallOnlyContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
):
  | MultiSendCallOnlyEthersContract_v1_0_0
  | MultiSendCallOnlyEthersContract_v1_0_6 {
  let multiSendCallContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendCallContract = MultiSendCallOnlyContractV100.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_0(multiSendCallContract)
    case '1.0.6':
      multiSendCallContract = MultiSendCallOnlyContractV106.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_6(multiSendCallContract)
  }
}

export function getSmartWalletFactoryContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
):
  | SmartWalletFacoryContractEthers_v1_0_0
  | SmartWalletFacoryContractEthers_v1_0_6 {
  let walletFactoryContract

  switch (smartAccountVersion) {
    case '1.0.0':
      walletFactoryContract = SmartWalletFactoryContractV100.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_0(walletFactoryContract)
    case '1.0.6':
      walletFactoryContract = SmartWalletFactoryContractV106.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_6(walletFactoryContract)
  }
}
