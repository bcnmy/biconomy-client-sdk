import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { Signer as AbstractSigner, ethers } from 'ethers'
import { Relayer } from '.'

import {
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  TransactionResult,
  RelayTransaction,
  DeployWallet,
  SmartAccountContext,
  SmartAccountState,
  SignedTransaction,
  WalletTransaction,
  RawTransactionType,
  RestRelayerOptions,
  FeeOptionsResponse,
  RelayResponse
} from '@biconomy-sdk/core-types'
import { MetaTransaction, encodeMultiSend } from './utils/multisend'
import { HttpMethod, sendRequest } from './utils/httpRequests'

/**
 * Relayer class that would be used via REST API to execute transactions
 */
export class RestRelayer implements Relayer {
  #relayServiceBaseUrl: string

  constructor(options: RestRelayerOptions) {
    const { url } = options
    this.#relayServiceBaseUrl = url
  }

  // TODO
  // Review function arguments and return values
  // Could get smartAccount instance
  // Defines a type that takes config, context for SCW in play along with other details
  async deployWallet(deployWallet: DeployWallet): Promise<TransactionResponse> {
    // Should check if already deployed
    //Review for index and ownership transfer case
    const { config, context, index = 0 } = deployWallet
    const { address } = config
    const { walletFactory } = context
    const isExist = await walletFactory.isWalletExist(address)
    if (isExist) {
      throw new Error('Smart Account is Already Deployed')
    }
    const walletDeployTxn = this.prepareWalletDeploy(deployWallet)
    // REST API call to relayer
    return sendRequest({
      url: `${this.#relayServiceBaseUrl}`,
      method: HttpMethod.Post,
      body: { ...walletDeployTxn, gasLimit: ethers.constants.Two.pow(24) }
    })
  }

  prepareWalletDeploy(
    // owner, entryPoint, handler, index
    deployWallet: DeployWallet
    // context: WalletContext
  ): { to: string; data: string } {
    const { config, context, index = 0 } = deployWallet
    const { walletFactory } = context
    const { owner, entryPointAddress, fallbackHandlerAddress } = config
    const factoryInterface = walletFactory.getInterface()

    return {
      to: walletFactory.getAddress(), // from context
      data: factoryInterface.encodeFunctionData(
        factoryInterface.getFunction('deployCounterFactualWallet'),
        [owner, entryPointAddress, fallbackHandlerAddress, index]
      )
    }
  }

  // Make gas limit a param
  // We would send manual gas limit with high targetTxGas (whenever targetTxGas can't be accurately estimated)

  async relay(relayTransaction: RelayTransaction): Promise<RelayResponse> {
    const { config, signedTx, context, gasLimit } = relayTransaction
    const { isDeployed, address } = config
    const { multiSendCall } = context // multisend has to be multiSendCallOnly here!
    if (!isDeployed) {
      const prepareWalletDeploy: DeployWallet = {
        config,
        context,
        index: 0
      }
      const { to, data } = this.prepareWalletDeploy(prepareWalletDeploy)

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

      const txnData = multiSendCall
        .getInterface()
        .encodeFunctionData('multiSend', [encodeMultiSend(txs)])
      
      const finalRawRx = {
        to: multiSendCall.getAddress(),
        data: txnData,
        chainId: signedTx.rawTx.chainId,
        value: 0
      }
      console.log('finaRawTx')
      console.log(finalRawRx)

      // API call
       // rawTx to becomes multiSend address and data gets prepared again 
       return sendRequest({
        url: `${this.#relayServiceBaseUrl}`,
        method: HttpMethod.Post,
        body: { ...finalRawRx, gasLimit: gasLimit, refundInfo: {
        tokenGasPrice: signedTx.tx.gasPrice,
        gasToken: signedTx.tx.gasToken } }
    })
   }
  
    console.log('signedTx', signedTx)
    // API call
    return sendRequest({
      url: `${this.#relayServiceBaseUrl}`,
      method: HttpMethod.Post,
      body: { ...signedTx.rawTx, gasLimit: gasLimit, refundInfo: {
        tokenGasPrice: signedTx.tx.gasPrice,
        gasToken: signedTx.tx.gasToken,
      } }
    })
  }

  async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
    return sendRequest({
      url: `${this.#relayServiceBaseUrl}/feeOptions?chainId=${chainId}`,
      method: HttpMethod.Get
    })
  }
}
