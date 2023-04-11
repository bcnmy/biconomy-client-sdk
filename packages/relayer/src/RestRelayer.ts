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
} from '@biconomy-devx/core-types'
import { Logger } from '@biconomy-devx/common'
import { MetaTransaction, encodeMultiSend } from './utils/MultiSend'
import { HttpMethod, sendRequest } from './utils/HttpRequests'
import { ClientMessenger } from '@biconomy/gasless-messaging-sdk'
import WebSocket, { EventEmitter } from 'isomorphic-ws'

/**
 * Relayer class that would be used via REST API to execute transactions
 */
export class RestRelayer implements IRelayer {
  #relayServiceBaseUrl: string
  #socketServerUrl: string

  relayerNodeEthersProvider!: { [chainId: number]: JsonRpcProvider }

  constructor(options: RestRelayerOptions) {
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
    const { owner } = config
    const factoryInterface = walletFactory.getInterface()

    return {
      to: walletFactory.getAddress(), // from context
      data: factoryInterface.encodeFunctionData(
        factoryInterface.getFunction('deployCounterFactualAccount'),
        [owner, index]
      )
    }
  }

  // if the wallet is deployed baseGas would be coming as part of struct in rawtx
  async relay(relayTransaction: RelayTransaction, engine: EventEmitter): Promise<RelayResponse> {
    const socketServerUrl = this.#socketServerUrl

    const clientMessenger = new ClientMessenger(socketServerUrl, WebSocket)

    if (!clientMessenger.socketClient.isConnected()) {
      await clientMessenger.connect()
      Logger.log('socket connect success')
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

    Logger.log('finalRawTx', finalRawRx)

    // based on the flag make rpc call to relayer code service with necessary rawTx data
    /* eslint-disable  @typescript-eslint/no-explicit-any */
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
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        onMined: (tx: any) => {
          const txId = tx.transactionId
          clientMessenger.unsubscribe(txId)
          Logger.log('Tx Hash mined message received at client', {
            transactionId: txId,
            hash: tx.transactionHash,
            receipt: tx.receipt
          })
          engine.emit('txMined', {
            msg: 'txn mined',
            id: txId,
            hash: tx.transactionHash,
            receipt: tx.receipt
          })
        },
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        onHashGenerated: async (tx: any) => {
          const txHash = tx.transactionHash
          const txId = tx.transactionId
          Logger.log('Tx Hash generated message received at client ', {
            transactionId: txId,
            hash: txHash
          })

          engine.emit('txHashGenerated', {
            id: tx.transactionId,
            hash: tx.transactionHash,
            msg: 'txn hash generated'
          })
        },
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        onHashChanged: async (tx: any) => {
          if (tx) {
            const txHash = tx.transactionHash
            const txId = tx.transactionId
            Logger.log('Tx Hash changed message received at client ', {
              transactionId: txId,
              hash: txHash
            })
            engine.emit('txHashChanged', {
              id: tx.transactionId,
              hash: tx.transactionHash,
              msg: 'txn hash changed'
            })
          }
        },
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        onError: async (tx: any) => {
          Logger.error('Error message received at client', tx)
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
