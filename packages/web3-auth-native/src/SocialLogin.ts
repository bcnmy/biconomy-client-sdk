import NodeClient, { WhiteListSignatureResponse } from '@biconomy-devx/node-client'
import base64url from 'base64url'
import log from 'loglevel'
import { URL } from 'react-native-url-polyfill'

import { IWebBrowser } from './types/IWebBrowser'
import { SdkInitParams, SdkLoginParams, SdkLogoutParams, SocialLoginDto } from './types/sdk'
import { State } from './types/State'

class SocialLogin {
  initParams: SdkInitParams

  webBrowser: IWebBrowser

  nodeClient!: NodeClient

  private backendUrl: string

  private clientId: string

  constructor(socialLoginDto: SocialLoginDto) {
    this.initParams = socialLoginDto.initParams
    if (!this.initParams.sdkUrl) {
      this.initParams.sdkUrl = 'https://sdk.openlogin.com'
    }
    this.webBrowser = socialLoginDto.webBrowser
    this.clientId =
      'BDtxlmCXNAWQFGiiaiVY3Qb1aN-d7DQ82OhT6B-RBr5j_rGnrKAqbIkvLJlf-ofYlJRiNSHbnkeHlsh8j3ueuYY'
    this.backendUrl = 'https://sdk-backend.prod.biconomy.io/v1'
    this.nodeClient = new NodeClient({ txServiceUrl: this.backendUrl })
  }

  async whitelistUrl(origin: string): Promise<string> {
    const whiteListUrlResponse: WhiteListSignatureResponse = await this.nodeClient.whitelistUrl(
      origin
    )
    return whiteListUrlResponse.data
  }

  async login(options: SdkLoginParams): Promise<State> {
    const result = await this.request('login', options.redirectUrl, options)
    if (result.type !== 'success' || !result.url) {
      log.error(`[Web3Auth] login flow failed with error type ${result.type}`)
      throw new Error(`login flow failed with error type ${result.type}`)
    }

    const fragment = new URL(result.url).hash
    const decodedPayload = base64url.decode(fragment)
    const state = JSON.parse(decodedPayload)
    return state
  }

  async logout(options: SdkLogoutParams): Promise<void> {
    const result = await this.request('logout', options.redirectUrl, options)
    if (result.type !== 'success' || !result.url) {
      log.error(`[Web3Auth] logout flow failed with error type ${result.type}`)
      throw new Error(`logout flow failed with error type ${result.type}`)
    }
  }

  private async request(path: string, redirectUrl: string, params: Record<string, unknown> = {}) {
    const initParams = {
      ...this.initParams,
      clientId: this.clientId,
      originData: params.originData,
      network: this.initParams.network || 'mainnet',
      ...(!!this.initParams.redirectUrl && {
        redirectUrl: this.initParams.redirectUrl
      })
    }

    const mergedParams = {
      init: initParams,
      params: {
        ...params,
        ...(!params.redirectUrl && { redirectUrl })
      }
    }

    log.debug(`[Web3Auth] params passed to Web3Auth: ${mergedParams}`)

    const hash = base64url.encode(JSON.stringify(mergedParams))

    const url = new URL(this.initParams.sdkUrl || '')
    url.pathname = `${url.pathname}${path}`
    url.hash = hash

    log.info(
      `[Web3Auth] opening login screen in browser at ${url.href}, will redirect to ${redirectUrl}`
    )

    return this.webBrowser.openAuthSessionAsync(url.href, redirectUrl)
  }
}

export default SocialLogin
