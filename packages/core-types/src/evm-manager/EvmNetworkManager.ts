import { BigNumber } from '@ethersproject/bignumber'
import { SmartWalletContract } from '../contracts/SmartWalletContract'
import { MultiSendContract } from '../contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from '../contracts/MultiSendCallOnlyContract'
import { SmartWalletFactoryContract } from '../contracts/SmartWalletFactoryContract'
import { DefaultCallbackHandlerContract } from '../contracts/DefaultCallbackHandlerContract'
import { SmartAccountVersion } from '../Types'

export interface IEvmNetworkManagerTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
}

export interface IEvmNetworkManager {
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getSmartWalletContract(
    smartAccountVersion: SmartAccountVersion,
    address: string
  ): SmartWalletContract
  getMultiSendContract(smartAccountVersion: SmartAccountVersion, address: string): MultiSendContract
  getMultiSendCallOnlyContract(
    smartAccountVersion: SmartAccountVersion,
    address: string
  ): MultiSendCallOnlyContract
  getSmartWalletFactoryContract(
    smartAccountVersion: SmartAccountVersion,
    address: string
  ): SmartWalletFactoryContract
  getDefaultCallbackHandlerContract(
    smartAccountVersion: SmartAccountVersion,
    address: string
  ): DefaultCallbackHandlerContract
  getContractCode(address: string): Promise<string>
  isContractDeployed(address: string): Promise<boolean>
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string>
  signMessage(message: string): Promise<string>
  estimateGas(
    transaction: IEvmNetworkManagerTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<number>
  call(transaction: IEvmNetworkManagerTransaction): Promise<string>
}
