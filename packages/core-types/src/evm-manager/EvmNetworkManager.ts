import { BigNumber } from '@ethersproject/bignumber'
import { SmartWalletContract } from 'contracts/SmartWalletContract'
import { MultiSendContract } from '../contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from '../contracts/MultiSendCallOnlyContract'
import { SmartWalletFactoryContract } from '../contracts/SmartWalletFactoryContract'
import { FallbackGasTankContract } from '../contracts/FallbackGasTankContract'
import { Eip3770Address, SmartAccountVersion } from '../Types'

export interface IEvmNetworkManagerTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
}

export interface IEvmNetworkManager {
  getEip3770Address(fullAddress: string): Promise<Eip3770Address>
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
  getFallbackGasTankContract(
    smartAccountVersion: SmartAccountVersion,
    address: string
  ): FallbackGasTankContract
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
