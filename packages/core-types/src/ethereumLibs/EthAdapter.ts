import { BigNumber } from '@ethersproject/bignumber'
import { SingletonDeployment } from '@gnosis.pm/safe-deployments'
import { SmartWalletContract } from 'contracts/SmartWalletContract'
import { AbiItem } from 'web3-utils'
import { MultiSendContract } from '../contracts/MultiSendContract'
import { MultiSendCallOnlyContract } from '../contracts/MultiSendCallOnlyContract'
import { SmartWalletFactoryContract } from '../contracts/SmartWalletFactoryContract'
import { SmartAccountVersion, Eip3770Address } from '../types'

export interface EthAdapterTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
}

export interface GetContractProps {
  chainId: number
  singletonDeployment?: SingletonDeployment
}

export interface EthAdapter {
  getEip3770Address(fullAddress: string): Promise<Eip3770Address>
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getSmartWalletContract(address: string): SmartWalletContract
  getMultiSendContract(address: string): MultiSendContract
  getMultiSendCallOnlyContract(address: string): MultiSendCallOnlyContract
  getSmartWalletFactoryContract(address: string): SmartWalletFactoryContract
  getContractCode(address: string): Promise<string>
  isContractDeployed(address: string): Promise<boolean>
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string>
  signMessage(message: string): Promise<string>
  estimateGas(
    transaction: EthAdapterTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<number>
  call(transaction: EthAdapterTransaction): Promise<string>
}
