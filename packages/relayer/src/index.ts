import { ethers, providers } from 'ethers'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { RawTransactionType } from '@biconomy-sdk/core-types';

export interface Relayer {
    // relayer will submit the transaction(s) to the network and return the transaction response.
    // The quote should be the one returned from getFeeOptions, if any.
    relay(rawTx: RawTransactionType /*quote?: FeeQuote*/): Promise<TransactionResponse>
    // wait for transaction confirmation
    // wait(metaTxnId: string | SignedTransactions, timeout: number): Promise<TransactionResponse>
  }
  
  export * from './local-relayer'