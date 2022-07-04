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
import { toTxResult } from '../../utils'
import { SmartWalletSV100 as SmartWallet_V1_0_0 } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletSV100'
import { SmartWalletSV100Interface } from '../../../typechain/src/ethers-v5/v1.0.0/SmartWalletSV100'
class SmartWalletContractEthers implements SmartWalletContract {
  constructor(public contract: SmartWallet_V1_0_0) {}

  async getVersion(): Promise<SmartAccountVersion> {
    return (await this.contract.VERSION()) as SmartAccountVersion
  }

  async getNonce(batchId: number): Promise<BigNumber>{
    return this.contract.getNonce(batchId)
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
      smartAccountTrx.data,
      batchId,
      feeRefundData,
      smartAccountTrx.encodedSignatures()
    )
    return toTxResult(txResponse, options)
  }

  encode: SmartWalletSV100Interface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default SmartWalletContractEthers
