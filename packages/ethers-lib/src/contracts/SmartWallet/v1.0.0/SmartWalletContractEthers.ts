import { BigNumber } from '@ethersproject/bignumber'
import {
  SmartAccountVersion,
  SmartWalletContract,
  WalletTransaction,
  ExecTransaction,
  FeeRefundV1_0_0, 
  FeeRefundV1_0_1,
  TransactionResult
} from '@biconomy-sdk/core-types'
import { toTxResult } from '../../../utils'
import { SmartWalletContractV100 as SmartWalletContract_TypeChain } from '../../../../typechain/src/ethers-v5/v1.0.0/SmartWalletContractV100'
import { SmartWalletContractV100Interface } from '../../../../typechain/src/ethers-v5/v1.0.0/SmartWalletContractV100'
import { getJsonWalletAddress, Interface } from 'ethers/lib/utils'
import { Contract } from '@ethersproject/contracts'
class SmartWalletContractEthers implements SmartWalletContract {
  constructor(public contract: SmartWalletContract_TypeChain) {}

  getInterface(): Interface {
    return this.contract.interface
  }

  getContract(): Contract {
    return this.contract
  }

  getAddress(): string {
    return this.contract.address
  }

  setAddress(address: string) {
    this.contract.attach(address)
  }

  async getOwner(): Promise<string> {
    return await this.contract.owner()
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
    _tx: ExecTransaction,
    batchId: number,
    refundInfo: FeeRefundV1_0_0,
    signatures: string
  ): Promise<TransactionResult> {
    // review: Gas estimation could come in here
    const txResponse = await this.contract.execTransaction(_tx, batchId, refundInfo, signatures)
    return toTxResult(txResponse)
  }

  encode: SmartWalletContractV100Interface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default SmartWalletContractEthers
