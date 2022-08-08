import {
  SmartWalletContract,
  SmartWalletFactoryContract,
  MultiSendContract,
  MultiSendCallOnlyContract
} from '@biconomy-sdk/core-types'
import { WalletFactory, SmartWallet, MultiSend, MultiSendCallOnly } from '../assets/index'

import EthersAdapter from '@biconomy-sdk/ethers-lib'

export function getSmartWalletFactoryContract(
  ethAdapter: EthersAdapter,
  address: string
): SmartWalletFactoryContract {
  return ethAdapter.getSmartWalletFactoryContract(address)
}
export function getMultiSendContract(
  ethAdapter: EthersAdapter,
  address: string
): MultiSendContract {
  return ethAdapter.getMultiSendContract(address)
}
export function getMultiSendCallOnlyContract(
  ethAdapter: EthersAdapter,
  address: string
): MultiSendCallOnlyContract {
  return ethAdapter.getMultiSendCallOnlyContract(address)
}
export function getSmartWalletContract(
  ethAdapter: EthersAdapter,
  address: string
): SmartWalletContract {
  return ethAdapter.getSmartWalletContract(address)
}
