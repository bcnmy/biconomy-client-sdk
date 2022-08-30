import { SmartWalletContractV100__factory as SmartWalletContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContractV100__factory'
import { SmartWalletContractV101__factory as SmartWalletContractV101 } from '../../typechain/src/ethers-v5/v1.0.1/factories/SmartWalletContractV101__factory'
import { SmartWalletContractV102__factory as SmartWalletContractV102 } from '../../typechain/src/ethers-v5/v1.0.2/factories/SmartWalletContractV102__factory'

import { MultiSendContractV100__factory as MultiSendContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContractV100__factory'
import { MultiSendContractV101__factory as MultiSendContractV101 } from '../../typechain/src/ethers-v5/v1.0.1/factories/MultiSendContractV101__factory'
import { MultiSendContractV102__factory as MultiSendContractV102 } from '../../typechain/src/ethers-v5/v1.0.2/factories/MultiSendContractV102__factory'

import { MultiSendCallOnlyContractV100__factory as MultiSendCallOnlyContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContractV100__factory'
import { MultiSendCallOnlyContractV101__factory as MultiSendCallOnlyContractV101 } from '../../typechain/src/ethers-v5/v1.0.1/factories/MultiSendCallOnlyContractV101__factory'
import { MultiSendCallOnlyContractV102__factory as MultiSendCallOnlyContractV102 } from '../../typechain/src/ethers-v5/v1.0.2/factories/MultiSendCallOnlyContractV102__factory'

import { SmartWalletFactoryContractV100__factory as SmartWalletFactoryContractV100 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContractV100__factory'
import { SmartWalletFactoryContractV101__factory as SmartWalletFactoryContractV101 } from '../../typechain/src/ethers-v5/v1.0.1/factories/SmartWalletFactoryContractV101__factory'
import { SmartWalletFactoryContractV102__factory as SmartWalletFactoryContractV102 } from '../../typechain/src/ethers-v5/v1.0.2/factories/SmartWalletFactoryContractV102__factory'

import SmartWalletContractEthers_v1_0_0 from './SmartWallet/v1.0.0/SmartWalletContractEthers'
import SmartWalletContractEthers_v1_0_1 from './SmartWallet/v1.0.1/SmartWalletContractEthers'
import SmartWalletContractEthers_v1_0_2 from './SmartWallet/v1.0.2/SmartWalletContractEthers'

import MultiSendEthersContract_v1_0_0 from './MultiSend/v1.0.0/MultiSendEthersContract'
import MultiSendEthersContract_v1_0_1 from './MultiSend/v1.0.1/MultiSendEthersContract'
import MultiSendEthersContract_v1_0_2 from './MultiSend/v1.0.2/MultiSendEthersContract'

import MultiSendCallOnlyEthersContract_v1_0_0 from './MultiSendCallOnly/v1.0.0/MultiSendCallOnlyEthersContract'
import MultiSendCallOnlyEthersContract_v1_0_1 from './MultiSendCallOnly/v1.0.1/MultiSendCallOnlyEthersContract'
import MultiSendCallOnlyEthersContract_v1_0_2 from './MultiSendCallOnly/v1.0.2/MultiSendCallOnlyEthersContract'

import SmartWalletFacoryContractEthers_v1_0_0 from './SmartWalletFactory/v1.0.0/SmartWalletProxyFactoryEthersContract'
import SmartWalletFacoryContractEthers_v1_0_1 from './SmartWalletFactory/v1.0.1/SmartWalletProxyFactoryEthersContract'
import SmartWalletFacoryContractEthers_v1_0_2 from './SmartWalletFactory/v1.0.2/SmartWalletProxyFactoryEthersContract'

import { JsonRpcProvider } from '@ethersproject/providers'
import { SmartAccountVersion } from '@biconomy-sdk/core-types'

export function getSmartWalletContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
):
  | SmartWalletContractEthers_v1_0_0
  | SmartWalletContractEthers_v1_0_1
  | SmartWalletContractEthers_v1_0_2 {
  let walletContract
  switch (smartAccountVersion) {
    case '1.0.0':
      walletContract = SmartWalletContractV100.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_0(walletContract)
    case '1.0.1':
      walletContract = SmartWalletContractV101.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_1(walletContract)
    case '1.0.2':
      walletContract = SmartWalletContractV102.connect(contractAddress, provider)
      return new SmartWalletContractEthers_v1_0_2(walletContract)
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
  | MultiSendEthersContract_v1_0_1
  | MultiSendEthersContract_v1_0_2 {
  let multiSendContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendContract = MultiSendContractV100.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_0(multiSendContract)
    case '1.0.1':
      multiSendContract = MultiSendContractV101.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_1(multiSendContract)
    case '1.0.2':
      multiSendContract = MultiSendContractV102.connect(contractAddress, provider)
      return new MultiSendEthersContract_v1_0_2(multiSendContract)
  }
}

export function getMultiSendCallOnlyContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
):
  | MultiSendCallOnlyEthersContract_v1_0_0
  | MultiSendCallOnlyEthersContract_v1_0_1
  | MultiSendCallOnlyEthersContract_v1_0_2 {
  let multiSendCallContract

  switch (smartAccountVersion) {
    case '1.0.0':
      multiSendCallContract = MultiSendCallOnlyContractV100.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_0(multiSendCallContract)
    case '1.0.1':
      multiSendCallContract = MultiSendCallOnlyContractV101.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_1(multiSendCallContract)
    case '1.0.2':
      multiSendCallContract = MultiSendCallOnlyContractV102.connect(contractAddress, provider)
      return new MultiSendCallOnlyEthersContract_v1_0_2(multiSendCallContract)
  }
}

export function getSmartWalletFactoryContractInstance(
  smartAccountVersion: SmartAccountVersion,
  contractAddress: string,
  provider: JsonRpcProvider
):
  | SmartWalletFacoryContractEthers_v1_0_0
  | SmartWalletFacoryContractEthers_v1_0_1
  | SmartWalletFacoryContractEthers_v1_0_2 {
  let walletFactoryContract

  switch (smartAccountVersion) {
    case '1.0.0':
      walletFactoryContract = SmartWalletFactoryContractV100.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_0(walletFactoryContract)
    case '1.0.1':
      walletFactoryContract = SmartWalletFactoryContractV101.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_1(walletFactoryContract)
    case '1.0.2':
      walletFactoryContract = SmartWalletFactoryContractV102.connect(contractAddress, provider)
      return new SmartWalletFacoryContractEthers_v1_0_2(walletFactoryContract)
  }
}
