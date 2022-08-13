import { TransactionResponse } from '@ethersproject/providers'
import { SignedTransaction, SmartAccountState, SmartAccountContext } from '@biconomy-sdk/core-types'

export interface Relayer {
<<<<<<< HEAD
    // relayer will submit the transaction(s) to the network and return the transaction response.
    // The quote should be the one returned from getFeeOptions, if any.
    /*quote?: FeeQuote*/
    relay(rawTx: SignedTransaction, config: SmartAccountState, context: SmartAccountContext): Promise<TransactionResponse>
    // wait for transaction confirmation
    // wait(metaTxnId: string | SignedTransactions, timeout: number): Promise<TransactionResponse>
  }
  
  export * from './local-relayer'
  export * from './rest-relayer'
=======
  // relayer will submit the transaction(s) to the network and return the transaction response.
  // The quote should be the one returned from getFeeOptions, if any.
  /*quote?: FeeQuote*/
  relay(
    rawTx: SignedTransaction,
    config: SmartAccountState,
    context: SmartAccountContext
  ): Promise<TransactionResponse>
  // wait for transaction confirmation
  // wait(metaTxnId: string | SignedTransactions, timeout: number): Promise<TransactionResponse>
}

export * from './local-relayer'
>>>>>>> d5276ee0ea7e352b374389a4604e2df839442ebe
