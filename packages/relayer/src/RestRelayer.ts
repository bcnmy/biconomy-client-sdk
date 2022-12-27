import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { IRelayer } from '.'

import {
  RelayTransaction,
  DeployWallet,
  RestRelayerOptions,
  FeeOptionsResponse,
  RelayResponse,
  GasLimit,
  ChainId
} from '@biconomy/core-types'
import { MetaTransaction, encodeMultiSend } from './utils/MultiSend'
import { HttpMethod, sendRequest } from './utils/HttpRequests'
import { ClientMessenger } from 'messaging-sdk'
import WebSocket, { EventEmitter } from 'isomorphic-ws'

/**
 * Relayer class that would be used via REST API to execute transactions
 */
export class RestRelayer implements IRelayer {
  #relayServiceBaseUrl: string
  #socketServerUrl: string

  relayerNodeEthersProvider!: { [chainId: number]: JsonRpcProvider }

  constructor(options: RestRelayerOptions) {
    // TODO : Rename url to relayerServiceUrl
    const { url, socketServerUrl } = options
    this.relayerNodeEthersProvider = {}
    this.#relayServiceBaseUrl = url
    this.#socketServerUrl = socketServerUrl
  }

  setRelayerNodeEthersProvider(chainId: ChainId) {
    if (!this.relayerNodeEthersProvider[chainId]) {
      this.relayerNodeEthersProvider[chainId] = new ethers.providers.JsonRpcProvider(
        this.#relayServiceBaseUrl,
        {
          name: 'Not actually connected to network, only talking to the Relayer!',
          chainId: chainId
        }
      )
    }
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

  async relay(relayTransaction: RelayTransaction, engine: EventEmitter): Promise<RelayResponse> {
    const socketServerUrl = this.#socketServerUrl

    const clientMessenger = new ClientMessenger(socketServerUrl, WebSocket)

    if (!clientMessenger.socketClient.isConnected()) {
      await clientMessenger.connect()
      console.log('connect success')
    }

    const { config, signedTx, context, gasLimit } = relayTransaction
    const { isDeployed, address } = config
    const chainId = signedTx.rawTx.chainId

    // Creates an instance of relayer node ethers provider for chain not already discovered
    this.setRelayerNodeEthersProvider(chainId)

    const { multiSendCall } = context // multisend has to be multiSendCallOnly here!
    let finalRawRx
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

      finalRawRx = {
        to: multiSendCall.getAddress(),
        data: txnData,
        chainId: signedTx.rawTx.chainId,
        value: 0
      }
    } else {
      finalRawRx = signedTx.rawTx
    }

    console.log('finaRawTx')
    console.log(finalRawRx)

    // reason : can not capture repsonse from jsonRpcProvider.send()
    /*const response: any = await this.relayerNodeEthersProvider[chainId].send(
      'eth_sendSmartContractWalletTransaction',
      [
        {
          ...finalRawRx,
          gasLimit: (gasLimit as GasLimit).hex,
          refundInfo: {
            tokenGasPrice: signedTx.tx.gasPrice,
            gasToken: signedTx.tx.gasToken
          }
        }
      ]
    )*/

    const response: any = await sendRequest({
      url: `${this.#relayServiceBaseUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'eth_sendSmartContractWalletTransaction',
        params: [
          {
            ...finalRawRx,
            // Could send custom high instead of undefined
            gasLimit: gasLimit ? (gasLimit as GasLimit).hex : undefined,
            walletInfo: {
              address: address
            },
            refundInfo: {
              tokenGasPrice: signedTx.tx.gasPrice,
              gasToken: signedTx.tx.gasToken
            }
          }
        ],
        id: 1234,
        jsonrpc: '2.0'
      }
    })

    if (response.data) {
      const transactionId = response.data.transactionId
      const connectionUrl = response.data.connectionUrl

      clientMessenger.createTransactionNotifier(transactionId, {
        onMined: (tx: any) => {
          const txId = tx.transactionId
          clientMessenger.unsubscribe(txId)
          console.log(
            `Tx Hash mined message received at client ${JSON.stringify({
              transactionId: txId,
              hash: tx.transactionHash,
              receipt: tx.receipt
            })}`
          )
          engine.emit('txMined', {
            msg: 'txn mined',
            id: txId,
            hash: tx.transactionHash,
            receipt: tx.receipt
          })
        },
        onHashGenerated: async (tx: any) => {
          const txHash = tx.transactionHash
          const txId = tx.transactionId
          console.log(
            `Tx Hash generated message received at client ${JSON.stringify({
              transactionId: txId,
              hash: txHash
            })}`
          )

          console.log(`Receive time for transaction id ${txId}: ${Date.now()}`)
          engine.emit('txHashGenerated', {
            id: tx.transactionId,
            hash: tx.transactionHash,
            msg: 'txn hash generated'
          })
        },
        onHashChanged: async (tx: any) => {
          if (tx) {
            const txHash = tx.transactionHash
            const txId = tx.transactionId
            console.log(
              `Tx Hash changed message received at client ${JSON.stringify({
                transactionId: txId,
                hash: txHash
              })}`
            )
            engine.emit('txHashChanged', {
              id: tx.transactionId,
              hash: tx.transactionHash,
              msg: 'txn hash changed'
            })
          }
        },
        onError: async (tx: any) => {
          console.log(`Error message received at client is ${tx}`)
          const err = tx.error
          const txId = tx.transactionId
          clientMessenger.unsubscribe(txId)

          engine.emit('error', {
            id: tx.transactionId,
            error: err,
            msg: 'error in txn'
          })
        }
      })

      return {
        connectionUrl: connectionUrl,
        transactionId: transactionId
      }
    } else {
      return {
        error: response.error || 'transaction failed'
      }
    }
  }

  async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
    return sendRequest({
      url: `${this.#relayServiceBaseUrl}/feeOptions?chainId=${chainId}`,
      method: HttpMethod.Get
    })
  }
}
