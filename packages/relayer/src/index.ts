import { FeeOptionsResponse } from '@biconomy-sdk/core-types'
import { RelayTransaction, RelayResponse } from '@biconomy-sdk/core-types'

// JsonRpcRequest
export interface IRelayer {
  // relayer will submit the transaction(s) to the network and return the transaction response.
  // The quote should be the one returned from getFeeOptions, if any.
  /*quote?: FeeQuote*/
  getFeeOptions(chainId: number): Promise<FeeOptionsResponse>
  relay(relayTransaction: RelayTransaction, engine: any): Promise<RelayResponse>
  // wait for transaction confirmation
  // wait(metaTxnId: string | SignedTransactions, timeout: number): Promise<TransactionResponse>
}

export * from './local-relayer'
export * from './rest-relayer'
