import { BigNumberish, Contract, utils } from 'ethers'
import { AddressZero } from '@ethersproject/constants'
import { IMetaTransaction, IWalletTransaction, Transaction } from '@biconomy-devx/core-types'
import { Logger } from '@biconomy-devx/common'

export class Utils {
  constructor() {
    Logger.log('Utils initialized')
  }

  buildSmartAccountTransaction = (template: {
    to: string
    value?: BigNumberish
    data?: string
    operation?: number
    targetTxGas?: number | string
    baseGas?: number | string
    gasPrice?: number | string
    tokenGasPriceFactor?: number | string
    gasToken?: string
    refundReceiver?: string
    nonce: number
  }): IWalletTransaction => {
    return {
      to: template.to,
      value: template.value || 0,
      data: template.data || '0x',
      operation: template.operation || 0,
      targetTxGas: template.targetTxGas || 0,
      baseGas: template.baseGas || 0,
      gasPrice: template.gasPrice || 0,
      tokenGasPriceFactor: template.tokenGasPriceFactor || 1,
      gasToken: template.gasToken || AddressZero,
      refundReceiver: template.refundReceiver || AddressZero,
      nonce: template.nonce
    }
  }

  buildSmartAccountTransactions = (transactions: Transaction[]): IMetaTransaction[] => {
    const txs: IMetaTransaction[] = []
    for (let i = 0; i < transactions.length; i++) {
      const innerTx: IWalletTransaction = this.buildSmartAccountTransaction({
        to: transactions[i].to,
        value: transactions[i].value,
        data: transactions[i].data, // for token transfers use encodeTransfer
        nonce: 0
      })

      txs.push(innerTx)
    }
    return txs
  }

  buildMultiSendSmartAccountTx = (
    multiSend: Contract,
    txs: IMetaTransaction[],
    nonce: number,
    overrides?: Partial<IWalletTransaction>
  ): IWalletTransaction => {
    return this.buildContractCall(
      multiSend,
      'multiSend',
      [this.encodeMultiSend(txs)],
      nonce,
      true,
      overrides
    )
  }

  buildMultiSendTx = (
    multiSend: Contract,
    txs: IMetaTransaction[],
    nonce: number,
    delegateCall?: boolean
  ): IMetaTransaction => {
    const data = multiSend.interface.encodeFunctionData('multiSend', [this.encodeMultiSend(txs)])
    return this.buildSmartAccountTransaction(
      Object.assign({
        to: multiSend.address,
        data,
        operation: delegateCall ? 1 : 0,
        nonce
      })
    )
  }

  encodeMultiSend = (txs: IMetaTransaction[]): string => {
    return '0x' + txs.map((tx) => this.encodeMetaTransaction(tx)).join('')
  }

  encodeMetaTransaction = (tx: IMetaTransaction): string => {
    const data = utils.arrayify(tx.data)
    const encoded = utils.solidityPack(
      ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
      [tx.operation, tx.to, tx.value, data.length, data]
    )
    return encoded.slice(2)
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  buildContractCall = (
    contract: Contract,
    method: string,
    params: any[],
    nonce: number,
    delegateCall?: boolean,
    overrides?: Partial<IWalletTransaction>
  ): IWalletTransaction => {
    const data = contract.interface.encodeFunctionData(method, params)
    return this.buildSmartAccountTransaction(
      Object.assign(
        {
          to: contract.address,
          data,
          operation: delegateCall ? 1 : 0,
          nonce
        },
        overrides
      )
    )
  }
}
