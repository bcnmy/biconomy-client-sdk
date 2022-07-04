import { BigNumber } from '@ethersproject/bignumber'
import {
  SmartAccountVersion,
  SmartWalletContract,
  SmartAccountTrx,
  SmartAccountTrxData,
  TransactionOptions,
  FeeRefundData,
  TransactionResult
} from 'core-types'
import { GnosisSafe as GnosisSafe_V1_1_1 } from '../../../typechain/src/ethers-v5/v1.1.1/GnosisSafe'
import { GnosisSafe as GnosisSafe_V1_2_0 } from '../../../typechain/src/ethers-v5/v1.2.0/GnosisSafe'
import {
  GnosisSafe as GnosisSafe_V1_3_0,
  GnosisSafeInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/GnosisSafe'
import { EthersTransactionOptions, EthersTransactionResult } from '../../types'
import { toTxResult } from '../../utils'
import { SENTINEL_ADDRESS } from '../../utils/constants'

abstract class SmartWalletContractEthers implements SmartWalletContract {
  constructor(public contract: GnosisSafe_V1_1_1 | GnosisSafe_V1_2_0 | GnosisSafe_V1_3_0) {}

  async getVersion(): Promise<SmartAccountVersion> {
    return (await this.contract.VERSION()) as SmartAccountVersion
  }

  getAddress(): string {
    return this.contract.address
  }

  async getNonce(): Promise<number> {
    return (await this.contract.nonce()).toNumber()
  }

  async getThreshold(): Promise<number> {
    return (await this.contract.getThreshold()).toNumber()
  }

  async getOwners(): Promise<string[]> {
    return this.contract.getOwners()
  }

  async isOwner(address: string): Promise<boolean> {
    return this.contract.isOwner(address)
  }

  async getTransactionHash(smartAccountTrxData: SmartAccountTrxData): Promise<string> {
    return this.contract.getTransactionHash(
      smartAccountTrxData.to,
      smartAccountTrxData.value,
      smartAccountTrxData.data,
      smartAccountTrxData.operation,
      smartAccountTrxData.SmartAccountTxGas,
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
      smartAccountTrx,
      batchId,
      feeRefundData
    )
    return toTxResult(txResponse, options)
  }

  encode: GnosisSafeInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default SmartWalletContractEthers
