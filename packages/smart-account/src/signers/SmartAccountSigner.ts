import { BigNumber, ethers, Signer as EthersSigner } from 'ethers'
import { BytesLike } from '@ethersproject/bytes'
import { JsonRpcProvider } from '@ethersproject/providers'
import { TypedDataDomain, TypedDataField, TypedDataSigner } from '@ethersproject/abstract-signer'
import { ChainId, SignTransactionDto } from '@biconomy-sdk/core-types'

// Might as well be RpcRelayer
// import { Relayer, RestRelayer } from '@biconomy-sdk/relayer'
import { Deferrable } from 'ethers/lib/utils'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { isJsonRpcProvider } from './json-rpc/utils'

export class SmartAccountSigner extends EthersSigner implements TypedDataSigner {
  readonly provider: JsonRpcProvider
  // readonly sender: JsonRpcSender
  readonly defaultChainId: number | undefined

  constructor(provider: JsonRpcProvider, defaultChainId?: number) {
    super()
    this.provider = provider
    this.defaultChainId = defaultChainId
    // this.sender = new JsonRpcSender(provider)
  }

  _address!: string
  // relayer: Relayer

  // Might have
  // _context: not smartAccountContext but the addresses of contracts from SmartAccountState

  // TBD
  // private _providers: { [key: number]: JsonRpcProvider } = {}

  /**
   * Note: When you do getAddress it could use provider.getAddress / provider.getSmartAccountAddress or directly access SmartAccountAPI
   */
  async getAddress(): Promise<string> {
    if (this._address) return this._address
    const accounts = await this.provider.send('eth_accounts', [])
    this._address = accounts[0]
    return ethers.utils.getAddress(this._address)
  }

  async getChainId(): Promise<number> {
    return (await this.provider.getNetwork()).chainId
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    if (!this.provider) {
      throw new Error('missing provider')
    }
    const signature: any = await this.provider.send('eth_signTransaction', [transaction])
    return signature
  }

  // getRelayer(chainId?: number): Promise<Relayer | undefined> {
  //   console.log(chainId)
  //   throw new Error('TODO')
  // }

  // Review getProvider
  // getProvider returns a JsonRpcProvider instance for the current chain.
  // Note that this method is bound to a particular chain
  // Review for the provider we want here
  async getProvider(chainId?: number): Promise<JsonRpcProvider | undefined> {
    if (chainId) {
      const currentChainId = await this.getChainId()
      if (currentChainId !== chainId) {
        throw new Error(
          `signer is attempting to access chain ${chainId}, but is already bound to chain ${currentChainId}`
        )
      }
    }
    return this.provider
  }

  // handle compatibility with smart account's intent
  // this should send the tx to relayers which will relay to network. 
  async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    console.log(transaction)
    const txHash = ''

    // @ts-ignore
    return txHash
  }

  // signMessage matches implementation from ethers JsonRpcSigner for compatibility, but with
  // multi-chain support.
  async signMessage(message: BytesLike): Promise<string> {
    if (!this.provider) {
      throw new Error('missing provider')
    }
    const data = typeof message === 'string' ? ethers.utils.toUtf8Bytes(message) : message
    const address = await this.getAddress()
    return await this.provider.send('personal_sign', [ethers.utils.hexlify(data), address])
  }

  // signTypedData matches implementation from ethers JsonRpcSigner for compatibility, but with
  // multi-chain support.
  // Review
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    chainId?: ChainId
  ): Promise<string> {
    const activeChainId = chainId ? chainId : await this.getChainId()
    const domainChainId = domain.chainId ? BigNumber.from(domain.chainId).toNumber() : undefined
    if (domainChainId && domainChainId !== activeChainId) {
      throw new Error('Domain chainId is different from active chainId.')
    }

    return await this.provider.send('eth_signTypedData_v4', [
      await (await this.getAddress()).toLowerCase,
      JSON.stringify(ethers.utils._TypedDataEncoder.getPayload(domain, types, message))
    ])
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    chainId?: ChainId
  ): Promise<string> {
    return this.signTypedData(domain, types, message, chainId)
  }

  connectUnchecked(): ethers.providers.JsonRpcSigner {
    throw new Error('connectUnchecked is unsupported')
  }

  connect(provider: JsonRpcProvider): SmartAccountSigner {
    if (isJsonRpcProvider(provider)) {
      return new SmartAccountSigner(provider)
    }
    throw new Error('unsupported: cannot get JSON-RPC Signer connection')
  }
}
