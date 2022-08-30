import { WalletTransaction, ExecTransaction, FeeRefundV1_0_0, FeeRefundV1_0_2 } from '../transaction.types'
import { SmartAccountVersion } from '../types'
import { BigNumber } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'

// TODO
// Rename
export interface SmartWalletContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
  setAddress(address: string): any
  getOwner(): Promise<string>
  getVersion(): Promise<SmartAccountVersion>
  getNonce(batchId: number): Promise<BigNumber>
  getTransactionHash(smartAccountTrxData: WalletTransaction): Promise<string>
  execTransaction(
    transaction: ExecTransaction,
    batchId: number,
    feeRefundData: FeeRefundV1_0_0,
    signatures: string
  ): any
  execTransaction(
    transaction: ExecTransaction,
    batchId: number,
    feeRefundData: FeeRefundV1_0_2,
    signatures: string
  ): any
  encode(methodName: string, params: any): string
}
