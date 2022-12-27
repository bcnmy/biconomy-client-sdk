import { BaseProvider, TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { BigNumber, Signer } from 'ethers'
import { Network } from '@ethersproject/networks'
import { hexValue, resolveProperties } from 'ethers/lib/utils'
import { getRequestId } from '@biconomy/common'
import { ClientConfig } from './ClientConfig'
import { ERC4337EthersSigner } from './ERC4337EthersSigner'
import { UserOperationEventListener } from './UserOperationEventListener'
import { HttpRpcClient } from './HttpRpcClient'
import { EntryPoint } from '@account-abstraction/contracts'
import { UserOperation } from '@biconomy/core-types'
import { BaseWalletAPI } from './BaseWalletAPI'
import { ClientMessenger } from 'messaging-sdk'
import WebSocket from 'isomorphic-ws'

export class ERC4337EthersProvider extends BaseProvider {
  readonly signer: ERC4337EthersSigner

  constructor(
    readonly config: ClientConfig,
    readonly originalSigner: Signer,
    readonly originalProvider: BaseProvider,
    readonly httpRpcClient: HttpRpcClient,
    readonly entryPoint: EntryPoint,
    readonly smartWalletAPI: BaseWalletAPI // instead of here we could actually make one in SmartAccount.ts and provide
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
      smartWalletAPI
    )
  }

  async init(): Promise<this> {
    await this.smartWalletAPI.init()
    return this
  }

  getSigner(): ERC4337EthersSigner {
    return this.signer
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async perform(method: string, params: any): Promise<any> {
    if (method === 'sendTransaction' || method === 'getTransactionReceipt') {
      // TODO: do we need 'perform' method to be available at all?
      // there is nobody out there to use it for ERC-4337 methods yet, we have nothing to override in fact.
      throw new Error('Should not get here. Investigate.')
    }
    return await this.originalProvider.perform(method, params)
  }

  async getTransaction(transactionHash: string | Promise<string>): Promise<TransactionResponse> {
    // TODO
    return await super.getTransaction(transactionHash)
  }

  async getTransactionReceipt(
    transactionHash: string | Promise<string>
  ): Promise<TransactionReceipt> {
    const requestId = await transactionHash
    const sender = await this.getSenderWalletAddress()
    return await new Promise<TransactionReceipt>((resolve, reject) => {
      new UserOperationEventListener(resolve, reject, this.entryPoint, sender, requestId).start()
    })
  }

  async getSenderWalletAddress(): Promise<string> {
    return await this.smartWalletAPI.getWalletAddress()
  }

  async waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt> {
    console.log(confirmations)
    const sender = await this.getSenderWalletAddress()

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

  // fabricate a response (using UserOperation events and requestId match filter) in a format usable by ethers users...

  /*async constructUserOpTransactionResponse(userOp1: UserOperation): Promise<TransactionResponse> {
    const userOp = await resolveProperties(userOp1)
    const requestId = getRequestId(userOp, this.config.entryPointAddress, this.config.chainId)
    const waitPromise = new Promise<TransactionReceipt>((resolve, reject) => {
      new UserOperationEventListener(
        resolve,
        reject,
        this.entryPoint,
        userOp.sender,
        requestId,
        userOp.nonce
      ).start()
    })
    return {
      hash: requestId,
      confirmations: 0,
      from: userOp.sender,
      nonce: BigNumber.from(userOp.nonce).toNumber(),
      gasLimit: BigNumber.from(userOp.callGasLimit), // ??
      value: BigNumber.from(0),
      data: hexValue(userOp.callData), // should extract the actual called method from this "execFromEntryPoint()" call
      chainId: this.config.chainId,
      wait: async (confirmations?: number): Promise<TransactionReceipt> => {
        console.log(confirmations)
        const transactionReceipt = await waitPromise
        if (userOp.initCode.length !== 0) {
          // checking if the wallet has been deployed by the transaction; it must be if we are here
          await !this.smartWalletAPI.checkWalletDeployed()
        }
        return transactionReceipt
      }
    }
  }*/

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
        console.log('connect success')
      } catch (err) {
        console.log('socket connection failure')
        console.log(err)
      }
    }

    const userOp = await resolveProperties(userOp1)
    const requestId = getRequestId(userOp, this.config.entryPointAddress, this.config.chainId)

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
      hash: requestId, // or transactionId // or watcher like wait()
      confirmations: 0,
      from: userOp.sender,
      nonce: BigNumber.from(userOp.nonce).toNumber(),
      gasLimit: BigNumber.from(userOp.callGasLimit), // ??
      value: BigNumber.from(0),
      data: hexValue(userOp.callData), // should extract the actual called method from this "execFromEntryPoint()" call
      chainId: this.config.chainId,
      wait: async (confirmations?: number): Promise<TransactionReceipt> => {
        console.log(confirmations)
        const transactionReceipt = waitPromise.then((receipt: TransactionReceipt) => {
          // console.log('received tx receipt ', receipt)
          return receipt
        })
        if (userOp.initCode.length !== 0) {
          // checking if the wallet has been deployed by the transaction; it must be if we are here
          await this.smartWalletAPI.checkWalletDeployed()
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
