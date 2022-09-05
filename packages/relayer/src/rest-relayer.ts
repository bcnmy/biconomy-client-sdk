import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { Signer as AbstractSigner, ethers } from 'ethers'
import { Relayer } from '.';

import {
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  TransactionResult,
  SmartAccountContext,
  SmartAccountState, 
  SignedTransaction,
  WalletTransaction,
  RawTransactionType,
  RestRelayerOptions,
  FeeOptionsResponse,
  RelayResponse
} from '@biconomy-sdk/core-types'
import { MetaTransaction, encodeMultiSend } from './utils/multisend';
import { HttpMethod, sendRequest } from './utils/httpRequests';

/**
 * Relayer class that would be used via REST API to execute transactions
 */
export class RestRelayer implements Relayer {    
    #relayServiceBaseUrl: string

    constructor(options: RestRelayerOptions) {
        const { url } = options;
        this.#relayServiceBaseUrl = url;
    }

    // TODO
    // Review function arguments and return values
    // Could get smartAccount instance 
    // Defines a type that takes config, context for SCW in play along with other details
    async deployWallet(config: SmartAccountState, context: SmartAccountContext, index:number = 0): Promise<TransactionResponse> {
      // Should check if already deployed
      //Review for index and ownership transfer case
      const {address} = config;
      const {walletFactory} = context;
      const isExist = await walletFactory.isWalletExist(address);
      if(isExist) {
        throw new Error("Smart Account is Already Deployed")
      }
      const walletDeployTxn = this.prepareWalletDeploy(config, context, index);
      // REST API call to relayer
      return sendRequest({
        url: `${this.#relayServiceBaseUrl}`,
        method: HttpMethod.Post,
        body: { ...walletDeployTxn, gasLimit: ethers.constants.Two.pow(24) }
      })
    }

    prepareWalletDeploy( // owner, entryPoint, handler, index
      config:SmartAccountState,
      context: SmartAccountContext,
      index: number = 0,
      // context: WalletContext
    ): { to: string, data: string} {
      const {walletFactory} = context;
      const {owner, entryPointAddress, fallbackHandlerAddress} = config;
      const factoryInterface = walletFactory.getInterface();
  
      return {
        to: walletFactory.getAddress(), // from context
        data: factoryInterface.encodeFunctionData(factoryInterface.getFunction('deployCounterFactualWallet'),
          [owner, entryPointAddress, fallbackHandlerAddress, index]
        )
      }
    }




    // Make gas limit a param
    // We would send manual gas limit with high targetTxGas (whenever targetTxGas can't be accurately estimated)
    async relay(signedTx: SignedTransaction, config: SmartAccountState, context: SmartAccountContext) : Promise<RelayResponse> {
      
      const { isDeployed, address } = config;
      const { multiSendCall } = context; // multisend has to be multiSendCallOnly here!
      if(!isDeployed) {
        // If not =>> preprendWalletDeploy
        const {to, data} = this.prepareWalletDeploy(config,context);
        const originalTx:WalletTransaction = signedTx.tx;

        const txs: MetaTransaction[] = [
          {
            to,
            value: 0,
            data,
            operation: 0
          },
          {
            to: address,
            value: 0,
            data: signedTx.rawTx.data || '',
            operation: 0
          }
        ]

        const txnData = multiSendCall.getInterface().encodeFunctionData("multiSend", [
          encodeMultiSend(txs),
        ]);
        console

        const finalRawRx = {
          to: multiSendCall.getAddress(),
          data: txnData,
          chainId: signedTx.rawTx.chainId,
          value: 0
        }
        console.log('finaRawTx');
        console.log(finalRawRx);

        // API call
        // rawTx to becomes multiSend address and data gets prepared again 
        return sendRequest({
            url: `${this.#relayServiceBaseUrl}`,
            method: HttpMethod.Post,
            body: { ...finalRawRx, /*gasLimit: {
              hex: '0x1E8480',
              type: 'hex'
              },*/ }
        })
      }
      console.log('signedTx', signedTx);
      console.log('gasLimit', ethers.constants.Two.pow(24));
      // API call
      return sendRequest({
        url: `${this.#relayServiceBaseUrl}`,
        method: HttpMethod.Post,
        body: { ...signedTx.rawTx, /*gasLimit: {
          hex: '0x1E8480',
          type: 'hex'
          },*/ refundInfo: {
          tokenGasPrice: signedTx.tx.gasPrice,
          gasToken: signedTx.tx.gasToken,
        } }
      })
    }

    async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
      return sendRequest({
        url: `${this.#relayServiceBaseUrl}/feeOptions?chainId=${chainId}`,
        method: HttpMethod.Get,
      })
    }
  }