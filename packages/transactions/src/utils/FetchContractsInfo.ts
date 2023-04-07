import { ChainConfig } from '@biconomy-devx/node-client'
import { ChainId } from '@biconomy-devx/core-types'
import {
  SmartWalletContract,
  SmartWalletFactoryContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  SmartAccountVersion,
  FallbackGasTankContract
} from '@biconomy-devx/core-types'

import EthersAdapter from '@biconomy-devx/ethers-lib'

export function getSmartWalletFactoryContract(
  smartAccountVersion: SmartAccountVersion,
  ethAdapter: EthersAdapter,
  address: string
): SmartWalletFactoryContract {
  return ethAdapter.getSmartWalletFactoryContract(smartAccountVersion, address)
}
export function getMultiSendContract(
  smartAccountVersion: SmartAccountVersion,
  ethAdapter: EthersAdapter,
  address: string
): MultiSendContract {
  return ethAdapter.getMultiSendContract(smartAccountVersion, address)
}
export function getMultiSendCallOnlyContract(
  smartAccountVersion: SmartAccountVersion,
  ethAdapter: EthersAdapter,
  address: string
): MultiSendCallOnlyContract {
  return ethAdapter.getMultiSendCallOnlyContract(smartAccountVersion, address)
}
export function getSmartWalletContract(
  smartAccountVersion: SmartAccountVersion,
  ethAdapter: EthersAdapter,
  address: string
): SmartWalletContract {
  return ethAdapter.getSmartWalletContract(smartAccountVersion, address)
}
export function getFallbackGasTankContract(
  smartAccountVersion: SmartAccountVersion,
  ethAdapter: EthersAdapter,
  address: string
): FallbackGasTankContract {
  return ethAdapter.getFallbackGasTankContract(smartAccountVersion, address)
}

export function getDefaultCallbackHandlerContract(
  smartAccountVersion: SmartAccountVersion,
  ethAdapter: EthersAdapter,
  address: string
): FallbackGasTankContract {
  return ethAdapter.getDefaultCallbackHandlerContract(smartAccountVersion, address)
}

export function findChainById(chainId: ChainId, chainConfig: ChainConfig[]): ChainConfig {
  const currentChainInfo = chainConfig.find((n: ChainConfig) => {
    return n.chainId === chainId
  })
  if (currentChainInfo) return currentChainInfo
  throw new Error('Chain Not Found')
}

export function findContractAddressesByVersion(
  smartAccountVersion: string,
  chainId: ChainId,
  chainConfig: ChainConfig[]
) {
  const chainInfo: ChainConfig = findChainById(chainId, chainConfig)
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const entryPointAddress = chainInfo.entryPoint.find((element: any) => {
    return element.version === smartAccountVersion
  })?.address
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const walletFactoryAddress = chainInfo.walletFactory.find((element: any) => {
    return element.version === smartAccountVersion
  })?.address
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const walletAddress = chainInfo.wallet.find((element: any) => {
    return element.version === smartAccountVersion
  })?.address
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const multiSendAddress = chainInfo.multiSend.find((element: any) => {
    return element.version === smartAccountVersion
  })?.address
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const multiSendCallAddress = chainInfo.multiSendCall.find((element: any) => {
    return element.version === smartAccountVersion
  })?.address
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const fallBackHandlerAddress = chainInfo.fallBackHandler.find((element: any) => {
    return element.version === smartAccountVersion
  })?.address

  if (!chainInfo) {
    throw new Error('Chain Not Found')
  }
  return {
    walletAddress,
    walletFactoryAddress,
    multiSendAddress,
    multiSendCallAddress,
    entryPointAddress,
    fallBackHandlerAddress
  }
}
