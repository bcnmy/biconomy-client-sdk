import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { Signer as AbstractSigner, ethers } from 'ethers'
import { Relayer } from '.';

import {
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  TransactionResult,
  SmartAccountContext
} from '@biconomy-sdk/core-types'

export class LocalRelayer implements Relayer {
    private signer: AbstractSigner
    // private txnOptions: TransactionRequest
  
    constructor(signer: AbstractSigner) {
      if(!AbstractSigner.isSigner(signer)) throw new Error("Signer must have a provider");
      this.signer = signer;
      if (!this.signer.provider) throw new Error("Signer must have a provider")
    }

    async deployWallet(factory:SmartWalletFactoryContract, context: SmartAccountContext, eoa:string, index:number = 0): Promise<TransactionResponse> {
      // TODO
      // Should check if already deployed
      const walletDeployTxn = this.prepareWalletDeploy(factory, context, eoa,index);
      const tx = this.signer.sendTransaction({ ...walletDeployTxn, gasLimit: ethers.constants.Two.pow(24) });
      return tx;
    }

    prepareWalletDeploy( // owner, entryPoint, handler, index
      factory:SmartWalletFactoryContract,
      context: SmartAccountContext,
      eoa: string,
      index: number = 0,
      // context: WalletContext
    ): { to: string, data: string} {
      const factoryInterface = factory.getInterface();
  
      return {
        to: factory.getAddress(), // from context
        data: factoryInterface.encodeFunctionData(factoryInterface.getFunction('deployCounterFactualWallet'),
          [eoa, context.entryPointAddress, context.fallbackHandlerAddress, index]
        )
      }
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