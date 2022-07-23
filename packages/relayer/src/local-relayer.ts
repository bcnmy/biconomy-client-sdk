import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { RawTransactionType } from '@biconomy-sdk/core-types';
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

    // TODO

    // Review function arguments and return values
    // Could get smartAccount instance 
    // Defines a type that takes config, context for SCW in play along with other details
    async deployWallet(factory:SmartWalletFactoryContract, context: SmartAccountContext, eoa:string, index:number = 0): Promise<TransactionResponse> {
      // Should check if already deployed
      const address = await factory.getAddressForCounterfactualWallet(eoa,index);
      const isExist = await factory.isWalletExist(address);
      if(isExist) {
        throw new Error("Smart Account is Already Deployed")
      }
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

    /*async isWalletDeployed(walletAddress: string): Promise<boolean> {
      // Check if wallet is deployed
      return true;
    }*/

    /*async getFeeOptions(
    ): Promise<{ options: FeeOption[] }> {
      return { options: [] }
    }*/
  
    /*async gasRefundOptions( 
    ): Promise<FeeOption[]> {
      const { options } = //await this.getFeeOptions()
      return options
    }*/

    // Should make an object that takes config and context
    async relay(rawTx: RawTransactionType /*quote?: FeeQuote*/) : Promise<TransactionResponse> {
      // check if wallet if deployed (needs wallet config)

      // If not =>> preprendWalletDeploy
      // Needs MultiSendCallOnly address from Context

      // @notice
      // We'd need multiSend instance then 
      // rawTx to becomes multiSend address and data gets prepared again 
      const tx = this.signer.sendTransaction({ ...rawTx, gasLimit: ethers.constants.Two.pow(24) });
      return tx;
    }
  }