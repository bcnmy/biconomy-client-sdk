import { Deferrable, defineReadOnly } from '@ethersproject/properties'
import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'

import { Bytes } from 'ethers'
import { ERC4337EthersProvider } from './ERC4337EthersProvider'
import { ClientConfig } from './ClientConfig'
import { HttpRpcClient } from './HttpRpcClient'
import { UserOperation } from '@biconomy/core-types'
import { BaseWalletAPI } from './BaseWalletAPI'
import EventEmitter from 'events'
import { ClientMessenger } from 'messaging-sdk'
import WebSocket from 'isomorphic-ws'
export class ERC4337EthersSigner extends Signer {
  // TODO: we have 'erc4337provider', remove shared dependencies or avoid two-way reference
  constructor(
    readonly config: ClientConfig,
    readonly originalSigner: Signer,
    readonly erc4337provider: ERC4337EthersProvider,
    readonly httpRpcClient: HttpRpcClient,
    readonly smartWalletAPI: BaseWalletAPI
  ) {
    super()
    defineReadOnly(this, 'provider', erc4337provider)
  }

  // This one is called by Contract. It signs the request and passes in to Provider to be sent.
  async sendTransaction(
    transaction: Deferrable<TransactionRequest>,
    walletDeployOnly = false,
    isDelegate = false,
    engine?: any // EventEmitter
  ): Promise<TransactionResponse> {
    const socketServerUrl = this.config.socketServerUrl

    const clientMessenger = new ClientMessenger(socketServerUrl, WebSocket)

    if (!clientMessenger.socketClient.isConnected()) {
      try {
        await clientMessenger.connect()
        console.log('connect success')
      } catch (err) {
        console.log('socket connection failure')
        console.log(err)
      }
    }

    console.log('received transaction ', transaction)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customData: any = transaction.customData
    console.log(customData)
    let gasLimit = 2000000
    if (customData && customData.appliedGasLimit) {
      gasLimit = customData.appliedGasLimit
      console.log('gaslimit applied from custom data...', gasLimit)
    }

    console.log('gaslimit ', gasLimit)
    console.log('transaction.gaslimit ', transaction.gasLimit)

    // TODO : //temp to avoid running into issues with populateTransaction when destination is multisend OR wallet is undeployed
    transaction.gasLimit = gasLimit
    // TODO : If isDeployed = false || skipGasLimit = true then use provided gas limit => transaction.gasLimit = gasLimit
    delete transaction.customData

    // transaction.from = await this.smartWalletAPI.getWalletAddress()

    let userOperation: UserOperation
    if (walletDeployOnly === true) {
      userOperation = await this.smartWalletAPI.createSignedUserOp({
        target: '',
        data: '',
        value: 0,
        gasLimit: 21000
      })
    } else {
      const tx: TransactionRequest = await this.populateTransaction(transaction)

      console.log('populate trx ', tx)
      await this.verifyAllNecessaryFields(tx)

      userOperation = await this.smartWalletAPI.createSignedUserOp({
        target: tx.to ?? '',
        data: tx.data?.toString() ?? '',
        value: tx.value,
        gasLimit: tx.gasLimit,
        isDelegateCall: isDelegate // get from customData.isBatchedToMultiSend
      })
    }
    console.log('signed userOp ', userOperation)

    let bundlerServiceResponse: any

    try {
      bundlerServiceResponse = await this.httpRpcClient.sendUserOpToBundler(userOperation)
      console.log('bundlerServiceResponse')
      console.log(bundlerServiceResponse)
    } catch (error) {
      // console.error('sendUserOpToBundler failed', error)
      throw this.unwrapError(error)
    }

    if (clientMessenger && clientMessenger.socketClient.isConnected()) {
      clientMessenger.createTransactionNotifier(bundlerServiceResponse.transactionId, {
        onHashGenerated: async (tx: any) => {
          if (tx) {
            const txHash = tx.transactionHash
            const txId = tx.transactionId
            console.log(
              `Tx Hash generated message received at client ${JSON.stringify({
                transactionId: txId,
                hash: txHash
              })}`
            )
            engine.emit('txHashGenerated', {
              id: tx.transactionId,
              hash: tx.transactionHash,
              msg: 'txn hash generated'
            })
          }
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
          if (tx) {
            console.log(`Error message received at client is ${tx}`)
            const err = tx.error
            const txId = tx.transactionId
            clientMessenger.unsubscribe(txId)
            // event emitter
            engine.emit('error', {
              id: tx.transactionId,
              error: err,
              msg: 'txn hash generated'
            })
          }
        }
      })
    }

    const transactionResponse = await this.erc4337provider.constructUserOpTransactionResponse(
      userOperation,
      bundlerServiceResponse.transactionId,
      engine
    )
    // const receipt = await transactionResponse.wait()
    // console.log('transactionResponse in sendTransaction', receipt)

    // TODO: handle errors - transaction that is "rejected" by bundler is _not likely_ to ever resolve its "wait()"
    return transactionResponse
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unwrapError(errorIn: any): Error {
    if (errorIn.body != null) {
      const errorBody = JSON.parse(errorIn.body)
      let paymasterInfo = ''
      let failedOpMessage: string | undefined = errorBody?.error?.message
      if (failedOpMessage?.includes('FailedOp') === true) {
        // TODO: better error extraction methods will be needed
        const matched = failedOpMessage.match(/FailedOp\((.*)\)/)
        if (matched != null) {
          const split = matched[1].split(',')
          paymasterInfo = `(paymaster address: ${split[1]})`
          failedOpMessage = split[2]
        }
      }
      const error = new Error(
        `The bundler has failed to include UserOperation in a batch: ${failedOpMessage} ${paymasterInfo})`
      )
      error.stack = errorIn.stack
      return error
    }
    return errorIn
  }

  async verifyAllNecessaryFields(transactionRequest: TransactionRequest): Promise<void> {
    if (transactionRequest.to == null) {
      throw new Error('Missing call target')
    }
    if (transactionRequest.data == null && transactionRequest.value == null) {
      // TBD: banning no-op UserOps seems to make sense on provider level
      throw new Error('Missing call data or value')
    }
  }

  connect(provider: Provider): Signer {
    console.log(provider)
    throw new Error('changing providers is not supported')
  }

  async getAddress(): Promise<string> {
    return await this.erc4337provider.getSenderWalletAddress()
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this.originalSigner.signMessage(message)
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    console.log(transaction)
    throw new Error('not implemented')
  }

  async signUserOperation(userOperation: UserOperation): Promise<string> {
    const message = await this.smartWalletAPI.getRequestId(userOperation)
    return await this.originalSigner.signMessage(message)
  }
}
