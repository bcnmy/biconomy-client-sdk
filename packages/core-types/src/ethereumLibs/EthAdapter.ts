import { BigNumber } from '@ethersproject/bignumber'
import { SingletonDeployment } from '@gnosis.pm/safe-deployments'
import { SmartWalletContract } from 'contracts/SmartWalletContract'
import { AbiItem } from 'web3-utils'
import { MultiSendContract } from '../contracts/MultiSendContract'
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
  smartAccountVersion: SmartAccountVersion
  chainId: number
  singletonDeployment?: SingletonDeployment
  customContractAddress?: string
  customContractAbi?: AbiItem | AbiItem[]
}

export interface EthAdapter {
  getEip3770Address(fullAddress: string): Promise<Eip3770Address>
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getSafeContract({
    smartAccountVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): SmartWalletContract
  getMultiSendContract({
    smartAccountVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): MultiSendContract
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
