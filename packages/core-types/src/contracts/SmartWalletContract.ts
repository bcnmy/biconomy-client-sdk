import {
  IWalletTransaction,
  ExecTransaction,
  IFeeRefundV1_0_0,
  IFeeRefundV1_0_1
} from '../TransactionTypes'
import { SmartAccountVersion } from '../Types'
import { BigNumber } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { BytesLike } from 'ethers'

export interface SmartWalletContract {
  getAddress(): string
  getContract(): Contract
  getInterface(): Interface
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  setAddress(address: string): any
  getOwner(): Promise<string>
  getVersion(): Promise<SmartAccountVersion>
  getNonce(batchId: number): Promise<BigNumber>
  nonce(): Promise<BigNumber>
  isValidSignature(_dataHash: string, _signature: string): Promise<BytesLike>
  getTransactionHash(smartAccountTrxData: IWalletTransaction): Promise<string>
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  execTransaction(
    transaction: ExecTransaction,
    feeRefundData: IFeeRefundV1_0_0,
    signatures: string
  ): any
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  execTransaction(
    transaction: ExecTransaction,
    feeRefundData: IFeeRefundV1_0_1,
    signatures: string
  ): any
  encode(methodName: string, params: any): string
}
