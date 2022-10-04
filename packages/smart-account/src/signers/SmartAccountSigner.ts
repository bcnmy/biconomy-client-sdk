import { ethers } from 'ethers'
import { BytesLike, Bytes } from '@ethersproject/bytes'
import { Web3Provider, ExternalProvider, JsonRpcProvider, Networkish } from '@ethersproject/providers'
import { TypedDataDomain, TypedDataField, TypedDataSigner } from '@ethersproject/abstract-signer'
import { Signer } from './Signer'

import { Signer as EthersSigner } from '@ethersproject/abstract-signer'

// ChainId , SmartAccountContext, SmartAccountConfig, SmartAccountState from @biconomy-sdk/core-types
import { 
    ChainId,
    SendTransactionDto,
    SignTransactionDto,
 } from '@biconomy-sdk/core-types'

// Might as well be RpcRelayer
import { Relayer, RestRelayer } from '@biconomy-sdk/relayer'

import { Deferrable } from 'ethers/lib/utils'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'

// Other ways : // Signer needs config, originalSigner, way to dispatch to rpc-relayer, smart-account-apis

export class SmartAccountSigner extends Signer implements TypedDataSigner {
    // Should be SmartAccountProvider (which makes me want to merge SmartAccountSigner in SmartAccountProvider file)
    readonly provider: Web3Provider 
    // Review
    readonly defaultChainId?: number

    constructor(provider: Web3Provider, defaultChainId?: number) {
        super()
        this.provider = provider
        this.defaultChainId = defaultChainId
    }

    _address!: string
    
    // Might have
    // _context: not smartAccountContext but the addresses of contracts from SmartAccountState
    // 

    // TBD
    private _providers: { [key: number]: Web3Provider } = {}


    /**
     * Note: When you do getAddress it could use provider.getAddress / provider.getSmartAccountAddress or directly access SmartAccountAPI 
     */
    async getAddress(): Promise<string> {
        if (this._address) return this._address
        const accounts = await this.provider.send('eth_accounts', [])
        this._address = accounts[0]
        return ethers.utils.getAddress(this._address)
      }

    async signTransaction(signTransactionDto: SignTransactionDto): Promise<string> {
        console.log(signTransactionDto)
        const signature = ""; 
        return signature
    }

    // getProvider

    getRelayer(chainId?: number): Promise<Relayer | undefined> {
        console.log(chainId)
        throw new Error('TODO')
    }

  // Review 
  // getProvider returns a Web3Provider instance for the current chain. 
  // Note that this method is bound to a particular chain
  
  // Review for the provider we want here
  async getProvider(chainId?: number): Promise<Web3Provider | undefined> {
    if (chainId) {
      const currentChainId = await this.getChainId()
      if (currentChainId !== chainId) {
        throw new Error(`signer is attempting to access chain ${chainId}, but is already bound to chain ${currentChainId}`)
      }
    }
    return this.provider
  }

  // handle compatibility with smart account's intent
  async sendTransaction(transaction: Deferrable<TransactionRequest>):Promise<TransactionResponse> {
    console.log(transaction)
    const txHash = ""

    // @ts-ignore
    return txHash
  }

    // signMessage matches implementation from ethers JsonRpcSigner for compatibility, but with
  // multi-chain support.
  async signMessage(message: BytesLike, chainId?: ChainId): Promise<string> {
    console.log(chainId)

    // TODO: study. sender JsonRpcRouter sender
    // const provider = await this.getSender(Number(chainId) || this.defaultChainId)

    const data = typeof message === 'string' ? ethers.utils.toUtf8Bytes(message) : message
    const address = await this.getAddress()
    return await this.provider!.send('personal_sign', [ethers.utils.hexlify(data), address])
  }

  // signTypedData matches implementation from ethers JsonRpcSigner for compatibility, but with
  // multi-chain support.
  // Review
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    chainId?: ChainId,
  ): Promise<string> {
    console.log(chainId)
    return await this.provider.send(
      'eth_signTypedData_v4',
      [await this.getAddress(), ethers.utils._TypedDataEncoder.getPayload(domain, types, message)]
    )
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

  connect(provider: ethers.providers.Provider): ethers.providers.JsonRpcSigner {
    console.log(provider)
    throw new Error('unsupported: cannot alter JSON-RPC Signer connection')
  }
}


// Other ways...
/*export class SmartAccountSigner extends EthersSigner {

  // Needs httpRpcClient to sendSCWTransactionToRelayer
  constructor() {

  }

  // Note: Since we're following this interface I feel createTransaction (from TransactionManager) should be part of this 
  async sendTransaction (transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {

  }
}*/