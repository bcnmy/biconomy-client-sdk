import { BigNumber } from '@ethersproject/bignumber'
import {
  SmartAccountVersion,
  SmartWalletContract,
  SmartAccountTrx,
  WalletTransaction,
  TransactionOptions,
  FeeRefundData,
  TransactionResult
} from '@biconomy-sdk/core-types'
import { toTxResult } from '../../utils'
import { SmartWalletContract as SmartWalletContract_TypeChain } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletContract'
import { SmartWalletContractInterface } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletContract'
import { getJsonWalletAddress, Interface } from 'ethers/lib/utils'
class SmartWalletContractEthers implements SmartWalletContract {
  constructor(public contract: SmartWalletContract_TypeChain) {}

  getInterface(): Interface {
    return this.contract.interface;
  }

  getAddress(): string {
    return this.contract.address
  }

  setAddress(address: string) {
    this.contract.attach(address);
  }

  async getOwner(): Promise<string> {
    return await this.contract.getOwner()
  }

  async getVersion(): Promise<SmartAccountVersion> {
    return (await this.contract.VERSION()) as SmartAccountVersion
  }

  async getNonce(batchId: number): Promise<BigNumber> {
    return await this.contract.getNonce(batchId)
  }
  async getTransactionHash(smartAccountTrxData: WalletTransaction): Promise<string> {
    return this.contract.getTransactionHash(
      smartAccountTrxData.to,
      smartAccountTrxData.value,
      smartAccountTrxData.data,
      smartAccountTrxData.operation,
      smartAccountTrxData.targetTxGas,
      smartAccountTrxData.baseGas,
      smartAccountTrxData.gasPrice,
      smartAccountTrxData.gasToken,
      smartAccountTrxData.refundReceiver,
      smartAccountTrxData.nonce
    )
  }

  async execTransaction(
    smartAccountTrx: SmartAccountTrx,
    batchId: number,
    feeRefundData: FeeRefundData,
    options: TransactionOptions
  ): Promise<TransactionResult> {
    // TODO: estimate GAS before making the transaction
    const txResponse = await this.contract.execTransaction(
      smartAccountTrx.data,
      batchId,
      feeRefundData,
      smartAccountTrx.encodedSignatures()
    )
    return toTxResult(txResponse, options)
  }

  encode: SmartWalletContractInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default SmartWalletContractEthers
