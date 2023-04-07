import React from 'react'
import { createRoot } from 'react-dom/client'
import { ethers } from 'ethers'
import { Web3AuthCore } from '@web3auth/core'
import {
  WALLET_ADAPTERS,
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
  UserInfo
} from '@web3auth/base'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import { MetamaskAdapter } from '@web3auth/metamask-adapter'
import { WalletConnectV1Adapter } from '@web3auth/wallet-connect-v1-adapter'
import QRCodeModal from '@walletconnect/qrcode-modal'
import NodeClient, { WhiteListSignatureResponse } from '@biconomy-devx/node-client'

import UI from './UI'
import {
  DefaultSocialLoginConfig,
  SocialLoginDTO,
  WhiteLabelDataType
} from './types/Web3AuthConfig'

function createLoginModal(socialLogin: SocialLogin) {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const root = createRoot((document as any).getElementById('w3a-modal'))
  root.render(<UI socialLogin={socialLogin} />)
}

class SocialLogin {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  walletDiv: any
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  walletIframe: any
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  iWin: any = false
  iframeInitialized = false
  isInit = false
  clientId: string
  whiteLabel: WhiteLabelDataType
  userInfo: Partial<UserInfo> | null = null
  web3auth: Web3AuthCore | null = null
  provider: SafeEventEmitterProvider | null = null
  backendUrl!: string
  nodeClient!: NodeClient

  constructor(backendUrl: string = defaultSocialLoginConfig.backendUrl) {
    this.createWalletDiv()
    this.isInit = false
    this.web3auth = null
    this.provider = null
    this.clientId =
      'BDtxlmCXNAWQFGiiaiVY3Qb1aN-d7DQ82OhT6B-RBr5j_rGnrKAqbIkvLJlf-ofYlJRiNSHbnkeHlsh8j3ueuYY'
    this.backendUrl = backendUrl
    this.nodeClient = new NodeClient({ txServiceUrl: this.backendUrl })
    this.whiteLabel = {
      name: 'Biconomy SDK',
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9543.png'
    }
  }

  async whitelistUrl(origin: string): Promise<string> {
    const whiteListUrlResponse: WhiteListSignatureResponse = await this.nodeClient.whitelistUrl(
      origin
    )
    console.log(whiteListUrlResponse.data)
    return whiteListUrlResponse.data
  }

  async init(socialLoginDTO?: Partial<SocialLoginDTO>) {
    const finalDTO: SocialLoginDTO = {
      chainId: '0x1',
      whitelistUrls: {},
      network: 'mainnet',
      whteLableData: this.whiteLabel
    }
    if (socialLoginDTO) {
      if (socialLoginDTO.chainId) finalDTO.chainId = socialLoginDTO.chainId
      if (socialLoginDTO.network) finalDTO.network = socialLoginDTO.network
      if (socialLoginDTO.whitelistUrls) finalDTO.whitelistUrls = socialLoginDTO.whitelistUrls
      if (socialLoginDTO.whteLableData) this.whiteLabel = socialLoginDTO.whteLableData
    }
    try {
      console.log('SocialLogin init')
      const web3AuthCore = new Web3AuthCore({
        clientId: this.clientId,
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: finalDTO.chainId
        }
      })

      const openloginAdapter = new OpenloginAdapter({
        adapterSettings: {
          clientId: this.clientId,
          network: finalDTO.network,
          uxMode: 'popup',
          whiteLabel: {
            name: this.whiteLabel.name,
            logoLight: this.whiteLabel.logo,
            logoDark: this.whiteLabel.logo,
            defaultLanguage: 'en',
            dark: true
          },
          originData: finalDTO.whitelistUrls
        }
      })
      const metamaskAdapter = new MetamaskAdapter({
        clientId: this.clientId
      })
      const wcAdapter = new WalletConnectV1Adapter({
        adapterSettings: {
          qrcodeModal: QRCodeModal
        }
      })

      web3AuthCore.configureAdapter(openloginAdapter)
      web3AuthCore.configureAdapter(metamaskAdapter)
      web3AuthCore.configureAdapter(wcAdapter)
      await web3AuthCore.init()
      this.web3auth = web3AuthCore
      if (web3AuthCore && web3AuthCore.provider) {
        this.provider = web3AuthCore.provider
      }
      createLoginModal(this)
      this.isInit = true
    } catch (error) {
      console.error(error)
    }
  }

  getProvider() {
    return this.provider
  }
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private _createIframe(iframeContainerDiv: any) {
    this.walletIframe = document.createElement('iframe')
    this.walletIframe.style.display = 'none'
    this.walletIframe.style.display = 'relative'
    this.walletIframe.onload = () => {
      this.iWin = this.walletIframe.contentWindow || this.walletIframe
      this.iframeInitialized = true
    }
    iframeContainerDiv.appendChild(this.walletIframe)
  }

  private createWalletDiv() {
    // create a fixed div into html but keep it hidden initially
    const walletDiv = document.createElement('div')
    walletDiv.id = 'w3a-modal'
    walletDiv.className = 'w3a-modal w3a-modal--light'
    walletDiv.style.display = 'none'
    walletDiv.style.position = 'fixed'
    walletDiv.style.top = '0'
    walletDiv.style.right = '0'
    walletDiv.style.height = '100%'
    walletDiv.style.width = '100%'
    walletDiv.style.background = 'rgba(33, 33, 33, 0.75)'
    walletDiv.style.zIndex = '100'
    this.walletDiv = walletDiv
    // insert div into top of body.
    document.body.insertBefore(walletDiv, document.body.firstChild)
    this._createIframe(walletDiv)
  }

  showWallet() {
    this.walletDiv.style.display = 'block'
    this.walletIframe.style.display = 'block'
    // Set height and width of the iframe to 600x341
    this.walletIframe.style.height = '600px'
    this.walletIframe.style.width = '341px'
    this.walletIframe.style.border = '0px'
    this.walletIframe.style.borderRadius = '3%'
    const el = document.getElementById('w3a-modal')
    el?.dispatchEvent(new Event('show-modal'))
  }

  hideWallet() {
    console.log('hide wallet')
    this.walletDiv.style.display = 'none'
    this.walletIframe.style.display = 'none'
  }

  async getUserInfo() {
    if (this.web3auth) {
      const userInfo = await this.web3auth.getUserInfo()
      this.userInfo = userInfo
      return userInfo
    }
    return null
  }

  async getPrivateKey() {
    if (this.web3auth && this.web3auth.provider) {
      const privateKey = await this.web3auth.provider.request({
        method: 'eth_private_key'
      })
      return privateKey
    }
    return null
  }

  async socialLogin(loginProvider: string) {
    if (!this.web3auth) {
      console.info('web3auth not initialized yet')
      return
    }
    try {
      const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
        loginProvider: loginProvider
      })
      if (!web3authProvider) {
        console.error('web3authProvider is null')
        return null
      }
      const web3Provider = new ethers.providers.Web3Provider(web3authProvider)
      const signer = web3Provider.getSigner()
      const gotAccount = await signer.getAddress()
      const network = await web3Provider.getNetwork()
      console.info(`EOA Address ${gotAccount}\nNetwork: ${network}`)
      this.provider = web3authProvider
      return web3authProvider
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async emailLogin(email: string) {
    if (!this.web3auth) {
      console.info('web3auth not initialized yet')
      return
    }
    try {
      const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
        loginProvider: 'email_passwordless',
        login_hint: email
      })
      if (!web3authProvider) {
        console.error('web3authProvider is null')
        return null
      }
      const web3Provider = new ethers.providers.Web3Provider(web3authProvider)
      const signer = web3Provider.getSigner()
      const gotAccount = await signer.getAddress()
      const network = await web3Provider.getNetwork()
      console.info(`EOA Address ${gotAccount}\nNetwork: ${network}`)
      this.provider = web3authProvider
      return web3authProvider
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async metamaskLogin() {
    if (!this.web3auth) {
      console.log('web3auth not initialized yet')
      return
    }
    try {
      const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.METAMASK)
      if (!web3authProvider) {
        console.log('web3authProvider is null')
        return null
      }
      const web3Provider = new ethers.providers.Web3Provider(web3authProvider)
      const signer = web3Provider.getSigner()
      const gotAccount = await signer.getAddress()
      const network = await web3Provider.getNetwork()
      console.info(`EOA Address ${gotAccount}\nNetwork: ${network}`)
      this.provider = web3authProvider
      return web3authProvider
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async walletConnectLogin() {
    if (!this.web3auth) {
      console.log('web3auth not initialized yet')
      return
    }
    try {
      const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.WALLET_CONNECT_V1)
      if (!web3authProvider) {
        console.log('web3authProvider is null')
        return null
      }
      const web3Provider = new ethers.providers.Web3Provider(web3authProvider)
      const signer = web3Provider.getSigner()
      const gotAccount = await signer.getAddress()
      const network = await web3Provider.getNetwork()
      console.info(`EOA Address ${gotAccount}\nNetwork: ${network}`)
      this.provider = web3authProvider
      return web3authProvider
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async logout() {
    if (!this.web3auth) {
      console.log('web3auth not initialized yet')
      return
    }
    await this.web3auth.logout()
    this.web3auth.clearCache()
    this.provider = null
  }
}

const defaultSocialLoginConfig: DefaultSocialLoginConfig = {
  backendUrl: 'https://sdk-backend.prod.biconomy.io/v1'
}

export default SocialLogin

let initializedSocialLogin: SocialLogin | null = null
const getSocialLoginSDK = async (socialLoginDTO?: Partial<SocialLoginDTO>) => {
  if (initializedSocialLogin) {
    return initializedSocialLogin
  }
  await socialLoginSDK.init(socialLoginDTO)
  initializedSocialLogin = socialLoginSDK
  return socialLoginSDK
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
const socialLoginSDK: SocialLogin = new SocialLogin()
;(window as any).socialLoginSDK = socialLoginSDK

export { socialLoginSDK, getSocialLoginSDK }
