import { JsonRpcProvider, TransactionResponse } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'
import { IFallbackRelayer } from '.'

import {
  RelayTransaction,
  DeployWallet,
  FallbackRelayerOptions,
  FeeOptionsResponse,
  GasLimit,
  ChainId
} from '@biconomy/core-types'
import { MetaTransaction, encodeMultiSend } from './utils/MultiSend'
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

  relayerNodeEthersProvider!: { [chainId: number]: JsonRpcProvider }

  constructor(options: FallbackRelayerOptions) {
    const { url, relayerServiceUrl } = options
    this.relayerNodeEthersProvider = {}
    this.#relayServiceBaseUrl = url
    this.#relayerServiceUrl = relayerServiceUrl
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

  // if the wallet is deployed baseGas would be coming as part of struct in rawtx
  async relay(
    relayTransaction: RelayTransaction,
    engine: EventEmitter
  ): Promise<TransactionResponse> {
    const relayerServiceUrl = this.#relayerServiceUrl

    const clientMessenger = new ClientMessenger(relayerServiceUrl, WebSocket)

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

    // based on the flag make rpc call to relayer code service with necessary rawTx data
    const response: any = await sendRequest({
      url: `${this.#relayServiceBaseUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'eth_sendGaslessFallbackTransaction',
        params: [
          {
            ...finalRawRx,
            gasLimit: (gasLimit as GasLimit).hex,
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

    console.log('rest relayer : response')
    console.log(response)
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
        hash: '',
        from: '',
        nonce: 0,
        gasLimit: BigNumber.from(0),
        value: BigNumber.from(0),
        data: hexValue('0x'),
        chainId: 0,
        confirmations: 0,
        wait: async (confirmations?: number) => {
          console.log(confirmations)
          return new Promise((resolve) => {
            const onTxMined = (tx: any) => {
              if (tx.id === transactionId) {
                engine.removeListener('txMined', onTxMined)
                resolve(tx.receipt)
              }
            }
            engine.on('txMined', onTxMined)
          })
        }
      }
    } else {
      throw new Error(response.error || 'transaction failed')
      // return {
      //   error: response.error || 'transaction failed'
      // }
    }
  }

  async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
    return sendRequest({
      url: `${this.#relayServiceBaseUrl}/feeOptions?chainId=${chainId}`,
      method: HttpMethod.Get
    })
  }
}
