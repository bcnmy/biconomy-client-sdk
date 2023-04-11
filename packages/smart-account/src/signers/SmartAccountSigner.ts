import { BigNumber, ethers } from 'ethers'
import { BytesLike } from '@ethersproject/bytes'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  TypedDataDomain,
  TypedDataField,
  TypedDataSigner,
  Signer as EthersSigner
} from '@ethersproject/abstract-signer'
import { ChainId } from '@biconomy-devx/core-types'

// Might as well be RpcRelayer
// import { IRelayer, RestRelayer } from '@biconomy-devx/relayer'
import { Deferrable } from 'ethers/lib/utils'
import { TransactionRequest } from '@ethersproject/providers'

export class SmartAccountSigner extends EthersSigner implements TypedDataSigner {
  readonly provider: JsonRpcProvider
  readonly defaultChainId: number | undefined

  constructor(provider: JsonRpcProvider, defaultChainId?: number) {
    super()
    this.provider = provider
    this.defaultChainId = defaultChainId
    //this.sender = new JsonRpcSender(provider)
  }

  _address!: string
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
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const signature: any = await this.provider.send('eth_signTransaction', [transaction])
    return signature
  }

  // signMessage matches implementation from ethers JsonRpcSigner for compatibility
  async signMessage(message: BytesLike): Promise<string> {
    if (!this.provider) {
      throw new Error('missing provider')
    }
    const data = typeof message === 'string' ? ethers.utils.toUtf8Bytes(message) : message
    const address = await this.getAddress()
    return await this.provider.send('personal_sign', [ethers.utils.hexlify(data), address])
  }

  // signTypedData matches implementation from ethers JsonRpcSigner for compatibility
  /* eslint-disable  @typescript-eslint/no-explicit-any */
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
      await this.getAddress(),
      JSON.stringify(ethers.utils._TypedDataEncoder.getPayload(domain, types, message))
    ])
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
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

  connect(_provider: JsonRpcProvider): SmartAccountSigner {
    if (_provider) {
      return new SmartAccountSigner(_provider)
    }
    throw new Error('unsupported: cannot get JSON-RPC Signer connection')
  }
}
