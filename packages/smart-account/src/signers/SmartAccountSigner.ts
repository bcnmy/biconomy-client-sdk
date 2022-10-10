import { BigNumber, ethers, Signer } from 'ethers'
import { BytesLike } from '@ethersproject/bytes'
import { JsonRpcProvider, Provider, Web3Provider } from '@ethersproject/providers'
import { TypedDataDomain, TypedDataField, TypedDataSigner } from '@ethersproject/abstract-signer'
import { MetaMaskInpageProvider } from '@metamask/providers'
import { ChainId, SignTransactionDto } from '@biconomy-sdk/core-types'

// Might as well be RpcRelayer
// import { Relayer, RestRelayer } from '@biconomy-sdk/relayer'
import { Deferrable } from 'ethers/lib/utils'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'




export class SmartAccountSigner extends Signer implements TypedDataSigner {
  metamaskProvider: MetaMaskInpageProvider
  readonly defaultChainId?: number
  readonly provider?: ethers.providers.Provider | undefined

  constructor(provider: MetaMaskInpageProvider, defaultChainId?: number) { 
    super()
    this.provider = ethers.getDefaultProvider()
    this.metamaskProvider = provider
    this.defaultChainId = defaultChainId
  }

  _address!: string


  async getAddress(): Promise<string> {
    if (this._address) return this._address
    const accounts: any = await this.metamaskProvider.request({method: 'eth_requestAccounts'})
    this._address = accounts[0]
    return ethers.utils.getAddress(this._address)
  }

  async getChainId(): Promise<number> {
    const chainId = await this.metamaskProvider.chainId
    if(chainId) {
        return parseInt(chainId)
    } else {
        throw new Error('')
    }
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const signature: any = await this.metamaskProvider.request({method:'eth_signTransaction', params: [transaction]})
    return signature
  }

  async getProvider(chainId?: number): Promise<Provider | undefined> {
    console.log(chainId)
    return ethers.getDefaultProvider("ethereum");
  }

  async signMessage(message: BytesLike): Promise<string> {
    const data = typeof message === 'string' ? ethers.utils.toUtf8Bytes(message) : message
    const address = await this.getAddress()
    const signature: any = await this.metamaskProvider.request({method: 'personal_sign', params: [ethers.utils.hexlify(data), address]})
    return signature 
}


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

    const signature: any = this.metamaskProvider.request({method: 'eth_signTypedData_v4', params: [
      await this.getAddress(),
      JSON.stringify(ethers.utils._TypedDataEncoder.getPayload(domain, types, message))
    ]})

    return signature
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
