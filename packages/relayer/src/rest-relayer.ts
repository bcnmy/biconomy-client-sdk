import { TransactionResponse } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { Relayer } from '.'

import {
  RelayTransaction,
  DeployWallet,
  RestRelayerOptions,
  FeeOptionsResponse,
  RelayResponse,
  GasLimit
} from '@biconomy-sdk/core-types'
import { MetaTransaction, encodeMultiSend } from './utils/multisend'
import { HttpMethod, sendRequest } from './utils/httpRequests'

/**
 * Relayer class that would be used via REST API to execute transactions
 */
export class RestRelayer implements Relayer {
  #relayServiceBaseUrl: string

  // #chainId: number

  relayerNodeEthersProvider: ethers.providers.JsonRpcProvider

  constructor(options: RestRelayerOptions) {
    const { url /*, chainId*/ } = options
    this.#relayServiceBaseUrl = url
    // this.#chainId = chainId
    this.relayerNodeEthersProvider = new ethers.providers.JsonRpcProvider(
      url /*, {
      name: 'Not actually connected to network, only talking to the Relayer!',
      chainId
    }*/
    )
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

      // JSON RPC Call
      // rawTx to becomes multiSend address and data gets prepared again
      return await this.relayerNodeEthersProvider.send('eth_sendSmartContractWalletTransaction', [
        {
          ...finalRawRx,
          gasLimit: (gasLimit as GasLimit).hex,
          refundInfo: {
            tokenGasPrice: signedTx.tx.gasPrice,
            gasToken: signedTx.tx.gasToken
          }
        }
      ])
    }

    console.log('signedTx', signedTx)

    // JSON RPC Call
    // rawTx to becomes multiSend address and data gets prepared again
    return await this.relayerNodeEthersProvider.send('eth_sendSmartContractWalletTransaction', [
      {
        ...signedTx.rawTx,
        gasLimit: (gasLimit as GasLimit).hex,
        refundInfo: {
          tokenGasPrice: signedTx.tx.gasPrice,
          gasToken: signedTx.tx.gasToken
        }
      }
    ])
  }

  async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
    return sendRequest({
      url: `${this.#relayServiceBaseUrl}/feeOptions?chainId=${chainId}`,
      method: HttpMethod.Get
    })
  }
}
