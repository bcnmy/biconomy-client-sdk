import { JsonRpcProvider, TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'
import { IFallbackRelayer } from '.'

import { RelayTransaction, FallbackRelayerOptions, GasLimit, ChainId } from '@biconomy/core-types'
import { HttpMethod, sendRequest } from './utils/HttpRequests'
import { ClientMessenger } from 'messaging-sdk'
import WebSocket, { EventEmitter } from 'isomorphic-ws'
import { hexValue } from 'ethers/lib/utils'

/**
 * Relayer class that would be used via REST API to execute transactions
 */
export class FallbackRelayer implements IFallbackRelayer {
  #relayServiceBaseUrl: string
  #relayerServiceUrl: string
  #dappAPIKey: string

  relayerNodeEthersProvider!: { [chainId: number]: JsonRpcProvider }

  constructor(options: FallbackRelayerOptions) {
    const { url, relayerServiceUrl, dappAPIKey } = options
    this.relayerNodeEthersProvider = {}
    this.#relayServiceBaseUrl = url
    this.#relayerServiceUrl = relayerServiceUrl
    this.#dappAPIKey = dappAPIKey
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

  async relay(
    relayTransaction: RelayTransaction,
    engine: EventEmitter
  ): Promise<TransactionResponse> {
    const relayerServiceUrl = this.#relayerServiceUrl
    const clientMessenger = new ClientMessenger(relayerServiceUrl, WebSocket)
    if (!clientMessenger.socketClient.isConnected()) {
      try {
        await clientMessenger.connect()
        console.log('connect success')
      } catch (err) {
        console.log('socket connection failure')
        console.log(err)
      }
    }

    const { config, signedTx, gasLimit } = relayTransaction
    const { address } = config

    const finalRawRx = signedTx.rawTx

    // based on the flag make rpc call to relayer code service with necessary rawTx data
    const response: any = await sendRequest({
      url: `${this.#relayServiceBaseUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'eth_sendGaslessFallbackTransaction',
        params: [
          {
            ...finalRawRx,
            gasLimit: (gasLimit as GasLimit)?.hex || '',
            walletInfo: {
              address: address
            },
            metaData: {
              dappAPIKey: this.#dappAPIKey
            }
          }
        ],
        id: 1234,
        jsonrpc: '2.0'
      }
    })
    console.log('rest relayer: ', response)

    if (response.data) {
      const transactionId = response.data.transactionId
      // const connectionUrl = response.data.connectionUrl

      const waitPromise = new Promise<TransactionReceipt>((resolve, reject) => {
        if (clientMessenger && clientMessenger.socketClient.isConnected()) {
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
              const receipt: TransactionReceipt = tx.receipt
              engine &&
                engine.emit('txMined', {
                  msg: 'txn mined',
                  id: txId,
                  hash: tx.transactionHash, // Note: differs from TransactionReceipt.transactionHash
                  receipt: tx.receipt
                })
              resolve(receipt)
            },
            onError: async (err: any) => {
              reject(err)
            }
          })
        }
      })

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
        hash: transactionId, // transactionId, can get orignal txHash by wait promise or event
        confirmations: 0,
        from: signedTx.rawTx.from || '',
        nonce: Number(signedTx.rawTx.nonce),
        gasLimit: BigNumber.from(signedTx.rawTx.gasLimit || 0),
        value: BigNumber.from(0),
        data: hexValue(signedTx.rawTx.data || '0x'),
        chainId: signedTx.rawTx.chainId,
        wait: async (confirmations?: number): Promise<TransactionReceipt> => {
          console.log(confirmations)
          const transactionReceipt = waitPromise.then((receipt: TransactionReceipt) => {
            return receipt
          })
          return transactionReceipt
        }
      }
    } else {
      throw new Error(response.error || 'transaction failed')
    }
  }
}
