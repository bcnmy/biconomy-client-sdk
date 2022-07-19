import { ethers, providers } from 'ethers'

export interface Relayer {
    // simulate
    // simulate()
  
    // estimateGasLimits will estimate the gas utilization from the transaction
    // before submission.
    /*estimateGasLimits(
      // transaction
    )*/ // returns?
  
    // getFeeOptions returns the fee options that the relayer will accept as payment.
    // If a quote is returned, it may be passed back to the relayer for dispatch.
    /*getFeeOptions(
      // transaction
    ): Promise<{ options: FeeOption[], quote?: FeeQuote }>*/

    // getRefundOptions?
  
    // getNonce?
  
    // relayer will submit the transaction(s) to the network and return the transaction response.
    // The quote should be the one returned from getFeeOptions, if any.
    // relay(signedTxs: SignedTransactions, quote?: FeeQuote): Promise<TransactionResponse>
  
    // wait for transaction confirmation
    // wait(metaTxnId: string | SignedTransactions, timeout: number): Promise<TransactionResponse>
  }
  
  export * from './local-relayer'