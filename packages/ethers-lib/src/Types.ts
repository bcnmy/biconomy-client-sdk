import { ContractTransaction } from '@ethersproject/contracts'
import { IBaseTransactionResult } from '@biconomy/core-types'

export interface IEthersTransactionOptions {
  from?: string
  gasLimit?: number | string
  gasPrice?: number | string
}

export interface IEthersTransactionResult extends IBaseTransactionResult {
  transactionResponse: ContractTransaction
  options?: IEthersTransactionOptions
}
