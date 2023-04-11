import { FeeOptionsResponse } from '@biconomy-devx/core-types'
import { RelayTransaction, RelayResponse } from '@biconomy-devx/core-types'
import { TransactionResponse } from '@ethersproject/providers'
import { EventEmitter } from 'isomorphic-ws'
export interface IRelayer {
  // relayer will submit the transaction(s) to the network and return the transaction response.

  getFeeOptions(chainId: number): Promise<FeeOptionsResponse>
  relay(relayTransaction: RelayTransaction, engine: EventEmitter): Promise<RelayResponse>

  // Tackled using messaging sdk
  // wait(metaTxnId: string | SignedTransactions, timeout: number): Promise<TransactionResponse>
}

export interface IFallbackRelayer {
  relay(relayTransaction: RelayTransaction, engine: EventEmitter): Promise<TransactionResponse>
}

export * from './LocalRelayer'
export * from './RestRelayer'
export * from './FallbackRelayer'
