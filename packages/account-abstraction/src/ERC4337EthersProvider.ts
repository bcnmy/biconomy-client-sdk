import { BaseProvider, TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { BigNumber, Signer } from 'ethers'
import { Network } from '@ethersproject/networks'
import { hexValue, resolveProperties } from 'ethers/lib/utils'
import { getUserOpHash } from '@biconomy-devx/common'
import { ClientConfig } from './ClientConfig'
import { ERC4337EthersSigner } from './ERC4337EthersSigner'
import { UserOperationEventListener } from './UserOperationEventListener'
import { HttpRpcClient } from './HttpRpcClient'
import { EntryPoint } from '@account-abstraction/contracts'
import { UserOperation } from '@biconomy-devx/core-types'
import { BaseAccountAPI } from './BaseAccountAPI'
import { ClientMessenger } from '@biconomy/gasless-messaging-sdk'
import WebSocket from 'isomorphic-ws'
import { Logger } from '@biconomy-devx/common'

export class ERC4337EthersProvider extends BaseProvider {
  initializedBlockNumber!: number

  readonly signer: ERC4337EthersSigner

  constructor(
    readonly config: ClientConfig,
    readonly originalSigner: Signer,
    readonly originalProvider: BaseProvider,
    readonly httpRpcClient: HttpRpcClient,
    readonly entryPoint: EntryPoint,
    readonly smartAccountAPI: BaseAccountAPI // instead of here we could actually make one in SmartAccount.ts and provide
  ) {
    super({
      name: 'ERC-4337 Custom Network',
      chainId: config.chainId
    })
    this.signer = new ERC4337EthersSigner(
      config,
      originalSigner,
      this,
      httpRpcClient,
      smartAccountAPI
    )
  }

  async init(): Promise<this> {
    // await this.httpRpcClient.validateChainId()
    this.initializedBlockNumber = await this.originalProvider.getBlockNumber()
    await this.smartAccountAPI.init()
    return this
  }

  getSigner(): ERC4337EthersSigner {
    return this.signer
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async perform(method: string, params: any): Promise<any> {
    if (method === 'sendTransaction' || method === 'getTransactionReceipt') {
      throw new Error('Should not get here. Investigate.')
    }
    return await this.originalProvider.perform(method, params)
  }

  async getTransaction(transactionHash: string | Promise<string>): Promise<TransactionResponse> {
    return await super.getTransaction(transactionHash)
  }

  async getTransactionReceipt(
    transactionHash: string | Promise<string>
  ): Promise<TransactionReceipt> {
    const userOpHash = await transactionHash
    const sender = await this.getSenderAccountAddress()
    return await new Promise<TransactionReceipt>((resolve, reject) => {
      new UserOperationEventListener(resolve, reject, this.entryPoint, sender, userOpHash).start()
    })
  }

  async getSenderAccountAddress(): Promise<string> {
    return await this.smartAccountAPI.getAccountAddress()
  }

  async waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt> {
    Logger.log('waitForTransaction', { transactionHash, confirmations, timeout })
    const sender = await this.getSenderAccountAddress()

    return await new Promise<TransactionReceipt>((resolve, reject) => {
      const listener = new UserOperationEventListener(
        resolve,
        reject,
        this.entryPoint,
        sender,
        transactionHash,
        undefined,
        timeout
      )
      listener.start()
    })
  }

  // fabricate a response (using messaging SDK) in a format usable by ethers users...
  async constructUserOpTransactionResponse(
    userOp1: UserOperation,
    transactionId: string,
    engine?: any // EventEmitter
  ): Promise<TransactionResponse> {
    const socketServerUrl = this.config.socketServerUrl

    const clientMessenger = new ClientMessenger(socketServerUrl, WebSocket)

    if (!clientMessenger.socketClient.isConnected()) {
      try {
        await clientMessenger.connect()
        Logger.log('socket connection success', { socketServerUrl })
      } catch (err) {
        Logger.error('socket connection failure', err)
      }
    }

    const userOp = await resolveProperties(userOp1)
    const userOpHash = getUserOpHash(userOp, this.config.entryPointAddress, this.config.chainId)

    const waitPromise = new Promise<TransactionReceipt>((resolve, reject) => {
      if (clientMessenger && clientMessenger.socketClient.isConnected()) {
        clientMessenger.createTransactionNotifier(transactionId, {
          onMined: (tx: any) => {
            const txId = tx.transactionId
            clientMessenger.unsubscribe(txId)
            Logger.log('Tx Hash mined message received at client', {
              transactionId: txId,
              hash: tx.transactionHash,
              receipt: tx.receipt
            })
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

    return {
      hash: userOpHash, // or transactionId // or watcher like wait()
      confirmations: 0,
      from: userOp.sender,
      nonce: BigNumber.from(userOp.nonce).toNumber(),
      gasLimit: BigNumber.from(userOp.callGasLimit), // ??
      value: BigNumber.from(0),
      data: hexValue(userOp.callData),
      chainId: this.config.chainId,
      wait: async (confirmations?: number): Promise<TransactionReceipt> => {
        Logger.log('wait confirmations', { confirmations })
        const transactionReceipt = waitPromise.then((receipt: TransactionReceipt) => {
          return receipt
        })
        if (userOp.initCode.length !== 0) {
          // checking if the wallet has been deployed by the transaction; it must be if we are here
          await this.smartAccountAPI.checkAccountDeployed()
        }
        return transactionReceipt
      }
    }
  }

  async detectNetwork(): Promise<Network> {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    return (this.originalProvider as any).detectNetwork()
  }
}
