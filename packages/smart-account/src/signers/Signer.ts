import {
  TypedDataDomain,
  TypedDataField,
  Signer as AbstractSigner
} from '@ethersproject/abstract-signer'

// ChainId , SmartAccountContext, SmartAccountConfig, SmartAccountState from @biconomy/core-types
import { ChainId, SignUserPaidTransactionDto } from '@biconomy/core-types'

import { JsonRpcProvider, TransactionResponse } from '@ethersproject/providers'
// Might as well be RpcRelayer
import { BytesLike } from '@ethersproject/bytes'
import { Deferrable } from 'ethers/lib/utils'
import { TransactionRequest } from '@ethersproject/providers'
import SmartAccount from '../SmartAccount'

export abstract class Signer extends AbstractSigner {
  abstract getProvider(chainId?: number): Promise<JsonRpcProvider | undefined>

  abstract signMessage(message: BytesLike, chainId?: ChainId): Promise<string>

  // signTypedData ..
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  abstract signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    chainId?: ChainId,
    allSigners?: boolean
  ): Promise<string>

  // sendTransaction takes an prepared transaction dto, and then has it signed by
  // the signer, and finally sends it to the rpc-relayer for submission to an Ethereum network.
  abstract sendTransaction(
    transaction: Deferrable<TransactionRequest>,
    engine?: SmartAccount
  ): // sendUserPaidTransactionDto: SendUserPaidTransactionDto
  Promise<TransactionResponse> // Could be transaction hash or receipt // TBD but it must follow AbstractSigner

  // We might as well (just) have sendTransactionBatch that takes array of transactions / sendTransactionsDto

  // Signs the transaction with original signer...
  abstract signTransaction(signUserPaidTransactionDto: SignUserPaidTransactionDto): Promise<string>
}
