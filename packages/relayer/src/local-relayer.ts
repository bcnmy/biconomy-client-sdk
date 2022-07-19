import { TransactionRequest } from '@ethersproject/providers'
import { Signer as AbstractSigner, ethers } from 'ethers'

export class LocalRelayer /*extends ProviderRelayer*/ /*implements Relayer*/ {
    //private signer: AbstractSigner
    //private txnOptions: TransactionRequest
  
    constructor(/*options: LocalRelayerOptions | AbstractSigner*/) {
      // super(AbstractSigner.isSigner(options) ? { provider: options.provider! } : { ...options, provider: options.signer.provider! })
      //this.signer = AbstractSigner.isSigner(options) ? options : options.signer
      // if (!this.signer.provider) throw new Error("Signer must have a provider")
    }

    async deployWallet() {
        // prepareWalletDeploy()
        // this.signer.sendTransaction
    }
  
    /*async getFeeOptions(
     
    ): Promise<{ options: FeeOption[] }> {
      return { options: [] }
    }*/
  
    /*async gasRefundOptions(
      
    ): Promise<FeeOption[]> {
      const { options } = //await this.getFeeOptions()
      return options
    }*/

    /*async relay(signedTxs: SignedTransactions, quote?: FeeQuote) : Promise<TransactionResponse> {
        // preprendWalletDeploy
        // get txn helpers
        // this.signer.sendTransaction()
    }*/
  }