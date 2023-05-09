import { BigNumberish } from 'ethers'
import { BytesLike } from '@ethersproject/bytes'
import { PaymasterServiceDataType } from '@biconomy/core-types'

export interface TransactionDetailsForUserOp {
  target: string
  data: string
  value?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
  // review
  isDelegateCall?: boolean //added by Biconomy
}

export interface TransactionDetailsForBatchUserOp {
  target: string[]
  data: BytesLike[]
  value: BigNumberish[]
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
  paymasterServiceData?: PaymasterServiceDataType
}
