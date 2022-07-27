import { SmartWalletContract, SmartWalletFactoryContract, MultiSendContract, MultiSendCallOnlyContract } from '@biconomy-sdk/core-types'
import { WalletFactory, SmartWallet, MultiSend, MultiSendCallOnly } from '../assets/index'

import EthersAdapter from '@biconomy-sdk/ethers-lib'

export function getSmartWalletFactoryContract(
  chainId: number,
  ethAdapter: EthersAdapter
): SmartWalletFactoryContract {
  return ethAdapter.getSmartWalletFactoryContract({
    chainId,
    singletonDeployment: WalletFactory
  })
}
export function getMultiSendContract(
  chainId: number,
  ethAdapter: EthersAdapter
): MultiSendContract {
  return ethAdapter.getMultiSendContract({ chainId, singletonDeployment: MultiSend })
}
export function getMultiSendCallOnlyContract(
  chainId: number,
  ethAdapter: EthersAdapter
): MultiSendCallOnlyContract {
  return ethAdapter.getMultiSendCallOnlyContract({ chainId, singletonDeployment: MultiSendCallOnly })
}
export function getSmartWalletContract(
  chainId: number,
  ethAdapter: EthersAdapter
): SmartWalletContract {
  return ethAdapter.getSmartWalletContract({ chainId, singletonDeployment: SmartWallet })
}
