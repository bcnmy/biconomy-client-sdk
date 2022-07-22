import {
  FeeRefundData,
  SmartAccountTrx,
  WalletTransaction,
  SmartAccountVersion,
  TransactionOptions,
  TransactionResult,
  ExecTransaction,
  FeeRefund
} from '../types'
import { BigNumber } from '@ethersproject/bignumber'
import { Interface } from "@ethersproject/abi";
import { Contract } from '@ethersproject/contracts';


// TODO
// Rename
export interface SmartWalletContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
  setAddress(address:string): any
  getOwner(): Promise<string>
  getVersion(): Promise<SmartAccountVersion>
  getNonce(batchId: number): Promise<BigNumber>
  getTransactionHash(smartAccountTrxData: WalletTransaction): Promise<string>
  execTransaction(
    transaction: ExecTransaction,
    batchId: number,
    feeRefundData: FeeRefund,
    signatures: string
  ): any
  encode(methodName: string, params: any): string
}
