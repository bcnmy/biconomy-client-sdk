import { Contract, utils } from 'ethers'
import { buildContractCall } from './Execution'
import { IMetaTransaction, IWalletTransaction } from '@biconomy-devx/core-types'

const encodeMetaTransaction = (tx: IMetaTransaction): string => {
  const data = utils.arrayify(tx.data)
  const encoded = utils.solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

export const encodeMultiSend = (txs: IMetaTransaction[]): string => {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('')
}

export const buildMultiSendSmartAccountTx = (
  multiSend: Contract,
  txs: IMetaTransaction[],
  nonce: number,
  overrides?: Partial<IWalletTransaction>
): IWalletTransaction => {
  return buildContractCall(multiSend, 'multiSend', [encodeMultiSend(txs)], nonce, true, overrides)
}
