import { Contract, BigNumberish, utils } from 'ethers'
import { AddressZero } from '@ethersproject/constants'

export interface MetaTransaction {
  to: string
  value: BigNumberish
  data: string
  operation: number
}

export interface WalletTransaction extends MetaTransaction {
  targetTxGas: string | number
  baseGas: string | number
  gasPrice: string | number
  gasToken: string
  refundReceiver: string
  nonce: number
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const buildContractCall = (
  contract: Contract,
  method: string,
  params: any[],
  nonce: number,
  delegateCall?: boolean,
  overrides?: Partial<WalletTransaction>
): WalletTransaction => {
  const data = contract.interface.encodeFunctionData(method, params)
  return buildSmartAccountTransaction(
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

export const buildSmartAccountTransaction = (template: {
  to: string
  value?: BigNumberish
  data?: string
  operation?: number
  targetTxGas?: number | string
  baseGas?: number | string
  gasPrice?: number | string
  gasToken?: string
  refundReceiver?: string
  nonce: number
}): WalletTransaction => {
  return {
    to: template.to,
    value: template.value || 0,
    data: template.data || '0x',
    operation: template.operation || 0,
    targetTxGas: template.targetTxGas || 0,
    baseGas: template.baseGas || 0,
    gasPrice: template.gasPrice || 0,
    gasToken: template.gasToken || AddressZero,
    refundReceiver: template.refundReceiver || AddressZero,
    nonce: template.nonce
  }
}

const encodeMetaTransaction = (tx: MetaTransaction): string => {
  const data = utils.arrayify(tx.data)
  const encoded = utils.solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

export const encodeMultiSend = (txs: MetaTransaction[]): string => {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('')
}

export const buildMultiSendSmartAccountTx = (
  multiSend: Contract,
  txs: MetaTransaction[],
  nonce: number,
  overrides?: Partial<WalletTransaction>
): WalletTransaction => {
  return buildContractCall(multiSend, 'multiSend', [encodeMultiSend(txs)], nonce, true, overrides)
}
